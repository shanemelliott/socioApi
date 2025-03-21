const { secret, eventId } = require("./config");
const { callGraphQLEndpoint } = require('./graphqlClient');

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
        sessionAttendeesConnection(eventId: $eventId, sessionId: $sessionId first: $first, after: $after) {
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
        const variables = {
            eventId: eventId,
            sessionId: sessionId,
            first: 10, //<<< Here is the limit issue. 
            after: endCursor
        };

        const data = await callGraphQLEndpoint(query, variables, secret);
        data.sessionAttendeesConnection.edges.forEach(edge => {
            allAttendees.push(edge.node);
        }
    );
       // allAttendees.push(...data.sessionAttendeesConnection.nodes);

        hasNextPage = data.sessionAttendeesConnection.pageInfo.hasNextPage;
        endCursor = data.sessionAttendeesConnection.pageInfo.endCursor;
         // Add a delay between consecutive queries to avoid hitting the rate limit
         if (hasNextPage) {
            await new Promise(resolve => setTimeout(resolve, 6000)); // 1-second delay
        }
    }

    return allAttendees;
}

// Example usage:
fetchAllOpenCheckinSessions(eventId, secret)
    .then(async sessions => {
        const sessionDetails = await Promise.all(sessions.map(async session => {
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
        }));
        return sessionDetails;
    })
    .then(sessionDetails => {
        console.log(sessionDetails);
    })
    .catch(error => console.error(error));