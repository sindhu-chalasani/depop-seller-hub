import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
    CognitoUserSession,
    CognitoUserAttribute,
} from "amazon-cognito-identity-js";

const userPool = new CognitoUserPool({
    UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
    ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
});

export function signIn(email: string, password: string): Promise<CognitoUserSession> {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });

    return new Promise((resolve, reject) => {
        user.authenticateUser(authDetails, {
            onSuccess: (session) => {
                localStorage.setItem("access_token", session.getAccessToken().getJwtToken());
                localStorage.setItem("id_token", session.getIdToken().getJwtToken());
                resolve(session);
            },
            onFailure: (err) => {
                reject(err);
            },
        });
    });
}

export function signUp(email: string, password: string): Promise<string> {
    const attributes = [
        new CognitoUserAttribute({ Name: "email", Value: email }),
    ];

    return new Promise((resolve, reject) => {
        userPool.signUp(email, password, attributes, [], (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result?.user.getUsername() ?? email);
        });
    });
}

export function confirmSignUp(email: string, code: string): Promise<void> {
    const user = new CognitoUser({ Username: email, Pool: userPool });

    return new Promise((resolve, reject) => {
        user.confirmRegistration(code, true, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

export function logout() {
    const user = userPool.getCurrentUser();
    if (user) user.signOut();
    localStorage.removeItem("access_token");
    localStorage.removeItem("id_token");
    window.location.href = "/login";
}
