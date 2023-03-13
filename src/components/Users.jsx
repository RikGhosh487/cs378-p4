// Hard-coded information (rest may or may not be generated dynamically)

// Note, this is a VERY bad way to store user information.
// Usernames and passwords should be stored on servers and
// passwords should be salted and hashed.

const USERS = [
  {
    username: "JohnDoe",
    password: "incorrect",
    displayname: "Jonathan",
  },
  {
    username: "JaneSmith01",
    password: "password",
    displayname: "Jane",
  },
  {
    username: "MarySue",
    password: "suemary11",
    displayname: "Mary",
  },
];

export default USERS;
