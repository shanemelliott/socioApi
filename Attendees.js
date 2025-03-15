const { secret, eventId } = require("./config");
const { callGraphQLEndpoint } = require('./graphqlClient');

async function fetchAllAttendees(eventId, secret) {
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
            first: 10,
            sessionId: 1177461,
            after: endCursor
        };

        const data = await callGraphQLEndpoint(query, variables, secret);
        console.log(data);
        const attendees = data.attendeesConnection.nodes;
        allAttendees.push(...attendees);

        hasNextPage = data.attendeesConnection.pageInfo.hasNextPage;
        endCursor = data.attendeesConnection.pageInfo.endCursor;
        // Add a delay between consecutive queries to avoid hitting the rate limit
       /* if (hasNextPage) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
        }*/
    }

    return allAttendees;
}

//  Find Attendees with no External ID

function noExternalId() {
    fetchAllAttendees(eventId, secret)
        .then(attendees => {
            attendees.forEach(attendee => {
                if (!attendee.externalId) {
                    console.log(`ID: ${attendee.id}, External ID: ${attendee.externalId}, First Name: ${attendee.profile.firstName}, Last Name: ${attendee.profile.lastName}`);
                }
            });
        })
        .catch(error => console.error(error));
}


// list attendees, id, name, externalId and email
function listAttendees() {
    fetchAllAttendees(eventId, secret)
        .then(attendees => {
            attendees.forEach(attendee => {
                console.log(`ID: ${attendee.id}, External ID: ${attendee.externalId}, First Name: ${attendee.profile.firstName}, Last Name: ${attendee.profile.lastName}`);
            });
        })
        .catch(error => console.error(error));
}

//noExternalId();
listAttendees();