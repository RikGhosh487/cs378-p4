// Imports

import React from "react";
import "./components.css";
import USERS from "./Users";

import {
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Label,
  ResponsiveContainer,
  Line,
  Tooltip,
} from "recharts";

// API links

const BASE_GEO_URL = "https://geocoding-api.open-meteo.com/v1/search?name=";

const HEAD_WEA_URL = "https://api.open-meteo.com/v1/forecast?latitude=";
const MIDD_WEA_URL = "&longitude=";
const FOOT_WEA_URL =
  "&hourly=temperature_2m&temperature_unit=fahrenheit&windspeed_unit=mph";

const FIREBASE_URL =
  "https://ut-austin-sp23-hci-p4-default-rtdb.firebaseio.com/";

function Cities() {
  /**
   * React useState() for state variables
   */
  let [user, setUser] = React.useState(null);
  let [locations, setLocations] = React.useState([]);
  let [usersList, setUsersList] = React.useState(USERS);
  let [weatherAPIURL, setWeatherAPIURL] = React.useState("");
  let [geolocAPIURL, setGeolocAPIURL] = React.useState("");
  let [selected, setSelected] = React.useState(0);
  let [displayName, setDisplayName] = React.useState("");
  let [login, setLogin] = React.useState(false);
  let [register, setRegister] = React.useState(false);
  let [userInput, setUserInput] = React.useState("");
  let [weatherData, setWeatherData] = React.useState([]);

  /**
   * React useRef() for callback references
   */
  let loginUsernameRef = React.useRef(null);
  let loginPasswordRef = React.useRef(null);
  let loginErrorSpanRef = React.useRef(null);

  let registerUsernameRef = React.useRef(null);
  let registerDisplaynameRef = React.useRef(null);
  let registerPasswordRef = React.useRef(null);
  let registerErrorSpanRef = React.useRef(null);

  let userInputRef = React.useRef(null);

  /**
   * React useEffect() hooks
   */

  // finds latitude and longitude given a city name
  React.useEffect(() => {
    let payload = null;
    const geolocationAPIHandler = async () => {
      try {
        const response = await fetch(geolocAPIURL);
        const json = await response.json();

        if (Object.keys(json).includes("results")) {
          // assume that the first option is the right option - No further validation
          let cityData = json.results[0];
          let name = cityData.name;
          let latitude = Number(cityData.latitude.toFixed(2));
          let longitude = Number(cityData.longitude.toFixed(2));

          let arrCpy = [...locations];
          payload = { cityname: name, lat: latitude, lon: longitude };
          arrCpy.push(payload);
          setLocations(arrCpy);
        } else {
          alert(
            "Could not find latitude and longitude information about this city"
          );
        }
      } catch (err) {
        console.error("Fetch Error");
        console.error(err);
      }

      // update records in database
      try {
        const postResponse = await fetch(
          `${FIREBASE_URL + "/users/" + user}/.json`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
        if (postResponse.status !== 200) {
          console.log("Error during POST: " + postResponse.statusText);
        }
      } catch (err) {
        console.error("Post Error");
        console.error(err);
      }
    };

    if (geolocAPIURL !== "") {
      geolocationAPIHandler();
      setGeolocAPIURL("");
    }
  }, [geolocAPIURL]);

  // finds predicted weather information for the day
  // given latitude and longitude data
  React.useEffect(() => {
    const weatherAPIHandler = async () => {
      try {
        const response = await fetch(weatherAPIURL);
        const json = await response.json();

        // check if the weather data is available
        if (Object.keys(json).includes("hourly")) {
          let times = json.hourly.time;
          let temps = json.hourly.temperature_2m;

          // extract the data for the day
          times = times.slice(0, 25);
          temps = temps.slice(0, 25);

          let finalData = [];

          times.forEach((item, idx) => {
            let hour = item.slice(-5);
            let first = parseInt(hour.slice(0, 2));

            // adjust for time formats
            if (first === 0) {
              hour = "12:00 AM";
            } else if (first === 12) {
              hour = "12:00 PM";
            } else if (first > 12) {
              hour = (first % 12) + ":00 PM";
            } else {
              hour = first + ":00 AM";
            }

            let temp = temps[idx];
            finalData.push({ hr: hour, tmp: temp + " °F", tmpInt: temp });
          });
          setWeatherData(finalData);
        }
      } catch (err) {
        console.error("Fetch Error");
        console.error(err);
      }
    };

    if (weatherAPIURL !== "") {
      weatherAPIHandler();
      setWeatherAPIURL("");
    }
  }, [weatherAPIURL]);

  // obtains data of save state for users from the database
  React.useEffect(() => {
    const fetchSaveState = async () => {
      try {
        const response = await fetch(
          `${FIREBASE_URL + "/users/" + user}/.json`
        );
        if (response.status !== 200) {
          console.log("Error during GET: " + response.statusText);
        } else {
          const json = await response.json();
          if (json === null) {
            setLocations([]);
          } else {
            setLocations(Object.keys(json).map((k) => json[k]));
          }
        }
      } catch (err) {
        console.error("Fetch Error");
        console.error(err);
      }
    };

    if (user !== null) {
      fetchSaveState();
    }
  }, [user]);

  // handler for submitting the Login form
  const loginFormSubmit = (event) => {
    // get values from Ref
    let usernameInput = loginUsernameRef.current.value;
    let passwordInput = loginPasswordRef.current.value;

    // check for empty inputs
    if (usernameInput === "" || passwordInput === "") {
      loginErrorSpanRef.current.innerHTML =
        "<em>Username or Password field was empty</em><em>Please Try Again</em>";
      event.preventDefault();
      return;
    }

    // check for whitespace in username
    if (/\s/.test(usernameInput) || /\s/.test(passwordInput)) {
      loginErrorSpanRef.current.innerHTML =
        "<em>Username or Password may not contain whitespace characters</em><em>Please Try Again</em>";
      event.preventDefault();
      return;
    }

    // validate
    let foundMatch = false;
    let match = null;

    usersList.forEach((elem) => {
      if (elem.username === usernameInput && elem.password === passwordInput) {
        foundMatch = true;
        match = elem;
      }
    });

    if (foundMatch) {
      loginUsernameRef.current.value = "";
      loginPasswordRef.current.value = "";
      loginErrorSpanRef.current.innerHTML = "";
      setLogin(false);
      setUser(match.username);
      setDisplayName(match.displayname);
    } else {
      loginErrorSpanRef.current.innerHTML =
        "<em>Username or Password is incorrect</em><em>Please Try Again</em>";
    }

    event.preventDefault();
  };

  // handler for submitting the Register form
  const registerFormSubmit = (event) => {
    // get values from Ref
    let usernameInput = registerUsernameRef.current.value;
    let displaynameInput = registerDisplaynameRef.current.value;
    let passwordInput = registerPasswordRef.current.value;

    // check for empty inputs
    if (
      usernameInput === "" ||
      displaynameInput === "" ||
      passwordInput === ""
    ) {
      registerErrorSpanRef.current.innerHTML =
        "<em>Username, Display Name, or Password field was empty</em><em>Please Try Again</em>";
      event.preventDefault();
      return;
    }

    if (/\s/.test(usernameInput) || /\s/.test(passwordInput)) {
      registerErrorSpanRef.current.innerHTML =
        "<em>Username or Password may not contain any whitespace characters</em><em>Please Try Again</em>";
      event.preventDefault();
      return;
    }

    if (!/.*\S.*/.test(displaynameInput)) {
      registerErrorSpanRef.current.innerHTML =
        "<em>Display name must contain at least one non-whitespace character</em><em>Please Try Again</em>";
      event.preventDefault();
      return;
    }

    // check if username already exists
    let match = false;
    usersList.forEach((item) => {
      if (item.username === usernameInput) {
        match = true;
      }
    });

    if (match) {
      registerErrorSpanRef.current.innerHTML = `<em>The username ${usernameInput} is already in use</em><em>Please try a different username</em>`;
      event.preventDefault();
      return;
    }

    let arrCpy = [...usersList];
    let payload = {
      username: usernameInput,
      password: passwordInput,
      displayname: displaynameInput,
    };
    arrCpy.push(payload);
    setUsersList(arrCpy);

    // reset form
    registerUsernameRef.current.value = "";
    registerPasswordRef.current.value = "";
    registerDisplaynameRef.current.value = "";
    registerErrorSpanRef.current.innerHTML = "";
    setRegister(false);
    setUser(usernameInput);
    setDisplayName(displaynameInput);

    event.preventDefault();
  };

  // handler for closing the login form
  const closeLoginForm = (event) => {
    loginUsernameRef.current.value = "";
    loginPasswordRef.current.value = "";
    loginErrorSpanRef.current.innerHTML = "";
    setLogin(false);
    event.preventDefault();
  };

  // handler for closing the register form
  const closeRegisterForm = (event) => {
    registerUsernameRef.current.value = "";
    registerPasswordRef.current.value = "";
    registerDisplaynameRef.current.value = "";
    registerErrorSpanRef.current.innerHTML = "";
    setRegister(false);
    event.preventDefault();
  };

  return (
    <>
      <div className="user-signin">
        {user === null && (
          <>
            <button
              onClick={() => {
                setLogin(true);
                setRegister(false);
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setRegister(true);
                setLogin(false);
              }}
            >
              Register
            </button>
          </>
        )}
        {user !== null && (
          <>
            <button
              style={{ display: user === null ? "none" : "block" }}
              onClick={() => {
                setLocations([]);
                setWeatherData([]);
                setUser(null);
              }}
            >
              Logout
            </button>
            <h5>Hello, {displayName}</h5>
          </>
        )}
      </div>

      <div className="btn-housing">
        {locations.length === 0 && user === null && (
          <em>Sign In to view weather from different cities</em>
        )}
        {locations.length === 0 && user !== null && (
          <em>
            Add cities by searching up their names and clicking the + button
          </em>
        )}
        {locations.map((loc, idx) => (
          <button
            className={idx === selected ? "selected" : null}
            key={`btn-${idx}`}
            onClick={() => {
              setSelected(idx);
              // perform an API call to produce weather data
              setWeatherAPIURL(
                HEAD_WEA_URL + loc.lat + MIDD_WEA_URL + loc.lon + FOOT_WEA_URL
              );
            }}
          >
            {loc.cityname}
          </button>
        ))}
      </div>
      {user !== null && (
        <div className="search-housing">
          <input
            type="text"
            ref={userInputRef}
            onChange={(e) => setUserInput(e.target.value)}
          ></input>
          <button
            onClick={() => {
              let tmpCpy = userInput.trim();
              userInputRef.current.value = "";
              setUserInput("");

              // check that the item is not already in the list
              let present = false;
              locations.forEach((item) => {
                if (item.cityname.toLowerCase() === tmpCpy.toLowerCase()) {
                  present = true;
                }
              });

              if (!present) {
                // perform an API call and see if the city is in the database
                setGeolocAPIURL(BASE_GEO_URL + tmpCpy.toLowerCase());
              }
            }}
          >
            +
          </button>
        </div>
      )}
      {user !== null && weatherData.length !== 0 && (
        <div className="fig-housing">
          <ResponsiveContainer width="90%" height={300}>
            <LineChart data={weatherData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hr" tick={false}>
                <Label
                  value="Time of Day"
                  position="insideBottom"
                  style={{ textAnchor: "middle" }}
                />
              </XAxis>
              <YAxis>
                <Label
                  angle={-90}
                  position="insideLeft"
                  value="Temperature (°F)"
                  style={{ textAnchor: "middle" }}
                />
              </YAxis>
              <Tooltip payload={weatherData} />
              <Line name="Temperature" type="monotone" dataKey="tmpInt" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {user !== null && weatherData.length !== 0 && (
        <div className="data-housing">
          <div className="data-content">
            <b>Time</b>
            {weatherData.map((item, idx) => (
              <p key={idx}>{item.hr}</p>
            ))}
          </div>
          <div className="data-content">
            <b>Temperature</b>
            {weatherData.map((item, idx) => (
              <p key={idx}>{item.tmp}</p>
            ))}
          </div>
        </div>
      )}
      <div className={"login-portal" + (login ? " active" : "")}>
        <form className="login-form" onSubmit={loginFormSubmit}>
          <span className="err" ref={loginErrorSpanRef}></span>
          <label>
            Username
            <input type="text" ref={loginUsernameRef}></input>
          </label>
          <label>
            Password
            <input type="password" ref={loginPasswordRef}></input>
          </label>
          <button>Login</button>
        </form>
        <div className="close-housing">
          <button onClick={closeLoginForm}>Cancel</button>
        </div>
      </div>
      <div className={"login-portal" + (register ? " active" : "")}>
        <form className="login-form" onSubmit={registerFormSubmit}>
          <span className="err" ref={registerErrorSpanRef}></span>
          <label>
            Username
            <input type="text" ref={registerUsernameRef}></input>
          </label>
          <label>
            Display name
            <input type="text" ref={registerDisplaynameRef}></input>
          </label>
          <label>
            Password
            <input type="password" ref={registerPasswordRef}></input>
          </label>
          <button>Register</button>
        </form>
        <div className="close-housing">
          <button onClick={closeRegisterForm}>Cancel</button>
        </div>
      </div>
    </>
  );
}

// Export

export default Cities;
