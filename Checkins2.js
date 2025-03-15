const { secret, eventId } = require("./config");
const { callGraphQLEndpoint } = require('./graphqlClient');
const pLimit = require('p-limit').default;
//I had to limit the number of concurrant sessions to 2 because the API was returning an error when I tried to fetch more than 2 sessions at a time
const limit = pLimit(3); // Cannot exceed 2 

async function fetchAllOpenCheckinSessions(eventId, secret) {
    let hasNextPage = true;
    let endCursor = null;
    const allOpenCheckinSessions = [];

    while (hasNextPage) {
        console.log(`Fetching sessions with checkin status OPEN. Cursor: ${endCursor}`);
        const query = `
        query sessionsConnection($eventId: Int!, $first: Int, $after: String, $filterParams: PublicSessionsFilterParamsInput) {
            sessionsConnection(eventId: $eventId, first: $first, after: $after, filterParams: $filterParams) {
                nodes {
                    id
                    checkinStatus
                    name
                    startTime
                    endTime
                }
                pageInfo {
                    endCursor
                    hasNextPage
                }
            }
        }
        `;
        const variables = {
            eventId: eventId,
            first: 10,
            after: endCursor,
            filterParams: {
                isCheckinEnabled: true
            }
        };

        const data = await callGraphQLEndpoint(query, variables, secret);
        allOpenCheckinSessions.push(...data.sessionsConnection.nodes);

        hasNextPage = data.sessionsConnection.pageInfo.hasNextPage;
        endCursor = data.sessionsConnection.pageInfo.endCursor;
    }

    return allOpenCheckinSessions;
}

async function fetchSessionAttendees(eventId, sessionId, secret) {
    let hasNextPage = true;
    let endCursor = null;
    const allAttendees = [];

    while (hasNextPage) {
        const query = `
        query SessionAttendeesConnection ($eventId: Int!, $sessionId: Int!, $first: Int, $after: String) {
            sessionAttendeesConnection(eventId: $eventId, sessionId: $sessionId, first: $first, after: $after) {
                edges {
                    node {
                        externalId
                        sessionCheckinStatus
                        id
                        profile {
                            firstName
                            lastName
                        }
                    }
                }
                pageInfo {
                    endCursor
                    hasNextPage
                }
            }
        }
        `;
        // Here is where I could not exceed 5 records at a time
        const variables = {
            eventId: eventId,
            sessionId: sessionId,
            first: 10,
            after: endCursor
        };

        const data = await callGraphQLEndpoint(query, variables, secret);
        data.sessionAttendeesConnection.edges.forEach(edge => {
            allAttendees.push(edge.node);
        });

        hasNextPage = data.sessionAttendeesConnection.pageInfo.hasNextPage;
        endCursor = data.sessionAttendeesConnection.pageInfo.endCursor;

       
    }

    return allAttendees;
}

// Example usage:
fetchAllOpenCheckinSessions(eventId, secret)
    .then(async sessions => {
        const sessionDetails = await Promise.all(sessions.map(session => 
            limit(async () => {
                const attendees = await fetchSessionAttendees(eventId, session.id, secret);
                return {
                    session: {
                        id: session.id,
                        name: session.name,
                        checkinStatus: session.checkinStatus,
                        startTime: session.startTime,
                        endTime: session.endTime
                    },
                    attendees: attendees
                };
            })
        ));
        return sessionDetails;
    })
    .then(sessionDetails => {
        console.log(sessionDetails);
        console.log(sessionDetails.length);
    })
    .catch(error => console.error(error));