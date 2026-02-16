import { Authenticator, View, Heading, Text } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import "../auth.css";

import MainApp from "./MainApp";

export default function AuthGate() {
  return (
    <div className="authShell">
      <Authenticator
        signUpAttributes={["email"]}
        components={{
          Header() {
            return (
              <View padding="xl" textAlign="center">
                <Heading level={3} className="authBrandTitle">
                  感情分析デモ
                </Heading>
                <Text className="authBrandSub">Secure API + Cognito Auth</Text>
              </View>
            );
          },
          Footer() {
            return (
              <View padding="large" textAlign="center">
                <Text className="authFooter">
                  © {new Date().getFullYear()} Sentiment Demo
                </Text>
              </View>
            );
          },
        }}
      >
        {({ signOut, user }) => (
          <div className="appAuthed">
            <MainApp signOut={signOut} user={user} />
          </div>
        )}
      </Authenticator>
    </div>
  );
}
