// Private access values for fitbit.
// These should not be shared.
export const client_id = 'CLIENT ID GOES HEERE';
export const redirect_uri = 'http://localhost:7676/fitbit/auth';

// To register an app and get these values visit: https://dev.fitbit.com/apps
// Note: You must add redirect urls as a callback URL
// Input values and save as fitbit_client_data.js

//NOTE: Client secret should be put into separate file fitbit_client_secret.js
// This is so only client_id and redirect_url will be exposed client-side
// and the secret can be used server-side only.