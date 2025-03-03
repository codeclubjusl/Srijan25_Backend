# paginations

#### request
```js
GET
${backURI}/api/v1/notifications/paginated?page=1,limit=2
```


#### response
```json
"data":{
  "next":{
    "page":page+1,
    "limit":limit,
  },
  "prev":{
    "page":page+1,
    "limit":limit,
  },
  "notifications":[
    {
      "_id":"new ObjectId('67bde6729db38bdf535da8e7')",
      "title":"title",
      "description":"hello world",
      "read":"true",
      "createdAt":"2025-03-02T15:32:19.342Z",

    }
  ]
}
```
> next and prev are optional fields that are passed

> if anything is wrong like email not found or notification not found then the response will be like

```json
  "data":{}
```