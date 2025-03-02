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
        query sessionAttendeesConnection($eventId: Int!, $sessionId: Int!, $first: Int, $after: String) {
            sessionAttendeesConnection(eventId: $eventId, sessionId: $sessionId, first: $first, after: $after) {
                nodes {
                    id
                    externalId
                    profile {
                        firstName
                        lastName
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
            first: 10,
            after: endCursor
        };

        const data = await callGraphQLEndpoint(query, variables, secret);
        allAttendees.push(...data.sessionAttendeesConnection.nodes);

        hasNextPage = data.sessionAttendeesConnection.pageInfo.hasNextPage;
        endCursor = data.sessionAttendeesConnection.pageInfo.endCursor;
    }

    return allAttendees;
}

// Example usage:
fetchAllOpenCheckinSessions(eventId, secret)
    .then(sessions => {
        sessions.forEach(async session => {
            console.log(`Session ID: ${session.id}`);
            const attendees = await fetchSessionAttendees(eventId, session.id, secret);
            attendees.forEach(attendee => {
                console.log(`Attendee ID: ${attendee.id}, External ID: ${attendee.externalId}, First Name: ${attendee.profile.firstName}, Last Name: ${attendee.profile.lastName}`);
            });
        });
    })
    .catch(error => console.error(error));