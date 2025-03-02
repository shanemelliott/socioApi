const { secret, eventId } = require("./config");
const { callGraphQLEndpoint } = require('./graphqlClient');

async function fetchAllAttendees(eventId, secret) {
    let hasNextPage = true;
    let endCursor = null;
    const allAttendees = [];

    while (hasNextPage) {
        const query = `
        query attendeesConnection($eventId: Int!, $first: Int, $after: String) {
            attendeesConnection(eventId: $eventId, first: $first, after: $after) {
                nodes {
                    id
                    externalId
                    profile {
                        firstName,
                        lastName,
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
            first: 100,
            after: endCursor
        };

        const data = await callGraphQLEndpoint(query, variables, secret);
        const attendees = data.attendeesConnection.nodes;
        allAttendees.push(...attendees);

        hasNextPage = data.attendeesConnection.pageInfo.hasNextPage;
        endCursor = data.attendeesConnection.pageInfo.endCursor;
    }

    return allAttendees;
}

//  Find Attendees with no External ID

function noExternalId() {
  fetchAllAttendees(eventId, secret)
    .then(attendees => {
        attendees.forEach(attendee => {
          if(!attendee.externalId) {
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