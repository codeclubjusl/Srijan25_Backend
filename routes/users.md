# User Routes Documentation 

## Authentication Note
All routes require authentication using the `isUserAuthenticated` middleware. Include your authentication token in the request headers, using cookies as is being checked in the middleware.

## Available Routes (Event related)

### 1. Get User Invitations
Retrieves all invitations for the authenticated user.

**Endpoint:** `GET /invitations`
```bash
curl -X GET "http://localhost:3080/invitations" \
```

### 2. Accept Invitation
Accepts a group invitation.

**Endpoint:** `POST /accept-invitation`

**Request Body:**
```json
{
    "groupId": "string"
}
```

```bash
curl -X POST "http://localhost:3080/accept-invitation" \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "group_id_here"
  }'
```

### 8. Reject Invitation
Rejects a group invitation.

**Endpoint:** `POST /reject-invitation`

**Request Body:**
```json
{
    "groupId": "string"
}
```

```bash
curl -X POST "http://localhost:3080/reject-invitation" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "group_id_here"
  }'
```

## Note
- Replace placeholder IDs (`:id`, `group_id_here`) with actual values
- All responses are in JSON format
- Error responses will include an `error` field with the error message