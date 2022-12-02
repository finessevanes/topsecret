import { useState, useEffect } from "react";
import SignClient from "@walletconnect/sign-client";
import { Web3Modal } from "@web3modal/standalone";
import "./App.css";

const web3Modal = new Web3Modal({
  projectId: process.env.REACT_APP_PROJECT_ID,
  standaloneChains: ["eip155:5"],
});

function App() {
  const [signClient, setSignClient] = useState();
  const [session, setSession] = useState([]);
  const [account, setAccount] = useState([]);

  async function createClient() {
    try {
      const signClient = await SignClient.init({
        projectId: process.env.REACT_APP_PROJECT_ID,
      });
      setSignClient(signClient);
      await subscribeToEvents(signClient);
    } catch (e) {
      console.log(e);
    }
  }

  const reset = () => {
    setAccount([]);
    setSession([]);
  };

  async function onConnect() {
    if (!signClient) {
      throw Error("Client is not set");
    }
    try {
      const proposalNamespace = {
        eip155: {
          methods: ["eth_sendTransaction"],
          chains: ["eip155:5"],
          events: ["connect", "disconnect"],
        },
      };
      const { uri, approval } = await signClient.connect({
        requiredNamespaces: proposalNamespace,
      });

      if (uri) {
        web3Modal.openModal({
          uri,
          standaloneChains: proposalNamespace.eip155.chains,
        });
        const sessionNamespace = await approval();
        onSessionConnected(sessionNamespace);
        web3Modal.closeModal();
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function onDisconnect() {
    try {
      await signClient.disconnect({
        topic: session.topic,
        message: "User disconnected.",
        code: 6000,
      });
      reset();
    } catch (e) {
      console.log(e);
    }
  }

  async function onSessionConnected(sessionNamespace) {
    try {
      setSession(sessionNamespace);
      setAccount(sessionNamespace.namespaces.eip155.accounts[0].slice(9));
    } catch (e) {
      console.log(e);
    }
  }

  async function subscribeToEvents(client) {
    try {
      if (client) {
        client.on("session_delete", () => {
          console.log("The user deleted the session from their wallet");
          reset();
        });
      }
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    if (!signClient) {
      createClient();
    }
  }, [signClient]);

  return (
    <div className="App">
      <h1>Sign v2 Standalone</h1>
      {account.length ? (
        <>
          <p>{account}</p>
          <button onClick={onDisconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={onConnect} disabled={!signClient}>
          Connect
        </button>
      )}
    </div>
  );
}

export default App;
