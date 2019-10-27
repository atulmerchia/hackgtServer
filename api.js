const axios = require('axios');

const API_URL = "https://api-reg.ncrsilverlab.com/v2"
let oauth2 = "", expiration = 0;

const token = _ => {
  if(expiration > Date.now()) return Promise.resolve(oauth2);

  console.log("Renewing token");
  return axios.get("https://api-reg-apigee.ncrsilverlab.com/v2/oauth2/token", {
    "headers": {
      'client_id': "gt_cranky_austin",
      "client_secret": "0062005e-0041-002e-5100-640056007500",
      "Authorization": "Basic Z3RfY3Jhbmt5X2F1c3RpbjpoYWNrZ3QyMDE5"
    }})
    .then(res => {
      res = res.data;
      if(res.IsSuccessful) {
        oauth2 = res.Result.AccessToken;
        expiration = (new Date(res.Result.AccessTokenExpirationUtc)).valueOf()
        console.log(Date.now(), expiration);
      }
      return oauth2;
    })
    .catch(err => oauth2)
}

const headers = async _ => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": `bearer ${await token()}`
});

module.exports.networkRequest = async function (method, path, data) {
  let params = { headers: await headers() };
  if (data) params = Object.assign(params, {data});
  return axios[method](API_URL + path, params)
    .then(res => {
      res = res.data;
      if(res.IsSuccessful) return res.Result;
      else throw res.Code;
    })
}
