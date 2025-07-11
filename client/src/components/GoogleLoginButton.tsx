import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

type GoogleUser = {
    name: string;
    email: string;
    picture:string;
    sub: string;
};

type Props = {
    onLogin: (user: GoogleUser) => void;
};


export default function GoogleLoginButton({ onLogin }: Props) {
    return (
        <GoogleLogin
            onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                    const decoded = jwtDecode<GoogleUser>(credentialResponse.credential);
                    onLogin(decoded); }
                else {
                    console.error("No credential found in response")
                } //user info sent back to pparent
            }}
            onError = {() => {
                console.log("Login Failed");
            }}
        />
    );
}