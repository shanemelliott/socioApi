# Socio API Integration

This repository contains code to interact with the Socio API to fetch session and attendee information. It uses Node.js with the `fetch` API and the `uuid` package to make GraphQL requests to the Socio API.

## Files

### `graphqlClient.js`

This file contains the `callGraphQLEndpoint` function, which is used to make GraphQL requests to the Socio API.

```javascript
const { v4: uuidv4 } = require('uuid');

async function callGraphQLEndpoint(query, variables = {}, secret) {
    const response = await fetch('https://public.api.socio.events/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secret}`,
            'idempotency-key': uuidv4(),
        },
        body: JSON.stringify({
            query: query,
            variables: variables
        }),
    });

    const responseBody = await response.json();
    if (response.ok) {
        return responseBody.data;
    } else {
        console.error('GraphQL Error:', responseBody);
        console.error('Query:', query);
        console.error('Variables:', variables);
        throw new Error(responseBody.errors ? responseBody.errors.map(error => error.message).join(', ') : 'Unknown error');
    }
}

module.exports = { callGraphQLEndpoint };

```
## CheckIns.js

This file contains functions to fetch sessions with open check-in status and to fetch attendees for a given session.

fetchAllOpenCheckinSessions
Fetches all sessions with isCheckinEnabled set to true.

fetchSessionAttendees
Fetches attendees for a given session ID.

## Example Usage
The example usage demonstrates how to fetch all open check-in sessions and then fetch and log the attendees for each session.
```javascript

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


```
## Chekins2.js

I noticed I was getting Cost errors using node, this file limits the concurrant executions of the api to 2 to enable calling it without the cost error.  I did this to identify the issue, but as exolained in GeckCheckins.js below, I am calling the socio api form php for production solution, so I am int expierencing this.

## API Reference
For more information about the Socio API, please refer to the official documentation:

[Socio API Documentation](https://public-api.socio.events/docs/2024-06/api/start)

## GetCheckins.js

This is an example for some endpoints I have interally to our org.  I am exposing the Socio API via an internal API to combine some internal logic needed for our use.  Please ignore. 




