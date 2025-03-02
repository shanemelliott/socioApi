const { secret, eventId } = require("./config");
const { callGraphQLEndpoint } = require('./graphqlClient');

const query = `
   query Event($eventId: Int!) {
  event(id: $eventId) {
    attendeeEstimate
    eventApp {
      coverUrl
      passType
      id
      promoPageUrl
      status
      app {
        color
        id
        logo
        name
      }
      webApp {
        enabled
      }
    }
    eventLocation {
      address
      endTime
      id
      latitude
      longitude
      name
      startTime
      timezone
    }
  }
}
`;
const variables = {
    eventId: eventId,
};

callGraphQLEndpoint(query, variables, secret)
    .then(data => {
        console.log(data);
    })
    .catch(error => console.error(error));