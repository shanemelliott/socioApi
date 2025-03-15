const { key, eventAgendaID,urlbase } = require("./config");
/*

Example of getting all the checked in particiants.  Since this endpoint also feeds the Volunteer signup, 
you have to pass isCheckinEnabled=true to get only the checkin sessions.  Then you have to call the sessionAttendees endpoint to get the attendees for each session.


a Sample result from this js file is below which is a combination of the session and the attendees for each session.  You will need
to look for sessionCheckinStatus: 'CHECKED_IN' to get the checked in attendees.

Attendees that add to their ageda will have a sessionCheckinStatus of 'NO_SHOW' and will need to be filtered out.

{
  sessionId: 0000000,
  checkinStatus: 'open',
  isCheckinEnabled: true,
  name: 'Start your Day the Yoga Way',
  startTime: '4/1/2025 6:30 AM',
  endTime: '4/1/2025 7:30 AM',
  capacity: 0,
  attendees: [
    {
      sessionId: 0000000,
      attendeeId: 0000000,
      externalId: '2-000000',
      sessionCheckinStatus: 'CHECKED_IN',
      firstName: 'Shane',
      lastName: 'Elliott'
    }
  ]
}
*/

//call the agendaSessions endpoint to get the checkin sessions
async function GetCheckinSessions() {
    const response = await fetch(`${urlbase}agendaSessions/${eventAgendaID}?isCheckinEnabled=true`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-WSC-API-KEY': key
        }
    });

    const responseBody = await response.json();
    if (response) {
        return responseBody.data;
    } else {
        throw new Error(responseBody.errors ? responseBody.errors.map(error => error.message).join(', ') : 'Unknown error');
    }
}
//call attendee endpoint to get the attendees for each session
async function GetSessionAttendees(sessionId) {
    const response = await fetch(`${urlbase}sessionAttendees/${sessionId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-WSC-API-KEY': key
        }
    });

    const responseBody = await response.json();
    if (response) {
        return responseBody.data;
    } else {
        throw new Error(responseBody.errors ? responseBody.errors.map(error => error.message).join(', ') : 'Unknown error');
    }
}

GetCheckinSessions()
.then(async data => {
    const sessionDetails = await Promise.all(data.map(async session => {
        //for each session get the seeion attendees
        const attendees = await GetSessionAttendees(session.sessionId);
        session.attendees = attendees;
        return session;
    }
    ))
    //for each session get log seeion attendees
    sessionDetails.forEach(session => {
        console.log(session);
    }
    )
}
)
.catch(err => {
    console.error(err)
}
)
