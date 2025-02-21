# Event Routes Documentation

## Overview
This API provides endpoints for managing events, participants, and group registrations.

## Base URL
`/events`

## Endpoints

### 1. Get Events Route
```http
GET /events/
```

**cURL Example:**
```bash
curl -X GET http://localhost:3080/api/v1/events/
```

### 2. Create New Event (Used by Admins to create an event in the backend)
```http
POST /events/new
```

**Required Body Parameters:**
- `name` (string): Event name
- `description` (string): Event description
- `isSolo` (boolean): Whether event is for individual participants
- `minParticipants` (number): Minimum number of participants
- `maxParticipants` (number): Maximum number of participants

**cURL Example:**
```bash
curl -X POST http://localhost:3080/api/v1/events/new \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coding Contest",
    "description": "Annual coding competition",
    "isSolo": "true",
    "minParticipants": 1,
    "maxParticipants": 1
  }'
```

### 3. Delete Event (Admin only)
```http
DELETE /events/delete/:slug
```

**URL Parameters:**
- `slug`: Event slug/identifier

**cURL Example:**
```bash
curl -X DELETE http://localhost:3080/api/v1/events/delete/coding-contest
```

### 4. Get Event Details (Admin only)
```http
GET /events/:slug
```

**cURL Example:**
```bash
curl -X GET http://localhost:3080/api/v1/events/coding-contest
```

### 5. Get Event Participants (Admin only)
```http
GET /events/:slug/getParticipants
```

**cURL Example:**
```bash
curl -X GET http://localhost:3080/api/v1/events/coding-contest/getParticipants
```

### 6. Get Participant Groups (Admin only)
```http
GET /events/:slug/getParticipantGroups
```

**cURL Example:**
```bash
curl -X GET http://localhost:3080/api/v1/events/coding-contest/getParticipantGroups
```

### 7. Get Pending Participant Groups (Admin only)
```http
GET /events/:slug/getPendingParticipantGroups
```

**cURL Example:**
```bash
curl -X GET http://localhost:3080/api/v1/events/coding-contest/getPendingParticipantGroups
```

### 8. Register for Event
```http
POST /events/:slug/register
```

**Required Body Parameters:**
- `userId` (string): ID of the user registering, i.e., the leader of the group
- `membersEmails` (array): Array of member emails for group events
- `groupName` (string, required for group events): Name of the group

**cURL Example for Solo Registration:**
```bash
curl -X POST http://localhost:3080/api/v1/events/coding-contest/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123"
  }'
```

**cURL Example for Group Registration:**
```bash
curl -X POST http://localhost:3080/api/v1/events/coding-contest/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "membersEmails": "[\"member1@email.com\",\"member2@email.com\"]",
    "groupName": "Team Awesome"
  }'
```
Send empty array if the team leader is participating alone in a group event which allows for solo participations

### 9. Cancel Registration
```http
POST /events/:slug/cancel-registration
```

**Required Body Parameters:**
- `userId` (string): ID of the user cancelling registration

**cURL Example:**
```bash
curl -X POST http://localhost:3080/events/api/v1/coding-contest/cancel-registration \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123"
  }'
```
Only the team leader can cancel registration for the entire team, and there exists no extra team for an event with the same leader (and members), so sending just the leader's userId is enough. So for both solo/team registraion, sending the userId is enough.

## Notes
- All responses follow the format: `{ success: boolean, data/message: any }`
- Group events require additional parameters compared to solo events
- Error responses include appropriate HTTP status codes and error messages
- The API handles both individual and group registrations differently based on the event type
