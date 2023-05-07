import { type NextPage } from "next";
import Head from "next/head";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Connect as ChatComponent } from "../components/wsChatComponent"
import { Chats as ChatsNavigation } from "../components/chatsNavigation"


const Home: NextPage = () => {
  const user = useUser()
  const [openChat, setOpenChat] = useState({ chatId: "", open: false, chatName: "" })


  if (!user.isLoaded) return <div/>


  return (
    <>
      <Head>
        <title>ChatApp</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen bg-zinc-800 flex flex-col items-center">
        <div className="text-zinc-100">
        {
        !user.isSignedIn && 
          <div className="w-screen h-screen homeBg flex flex-col justify-center items-center">
            <h1 className="text-4xl font-bold mb-10">Interactive Chatting 💬</h1>
            <SignInButton mode="modal">
              <button className="text-zinc-800 p-10 signOutGradient w-[40%] rounded-xl text-3xl font-bold drop-shadow-xl">
                Sign in
              </button>
            </SignInButton>
          </div>
        }
        {
          !!user.isSignedIn &&
          <SignOutButton>
            <button className="btn w-screen signOutGradient p-2 text-zinc-800 font-bold">
              SIGN OUT
            </button>
          </SignOutButton>
        }
        </div>
        { !!user.isSignedIn &&
          <div className="flex w-screen h-screen">
            <div className="w-[40%] h-[96%]">
              <ChatsNavigation openChat={openChat} setOpenChat={setOpenChat} />
            </div>
            { openChat.open
              ? <div className="w-[100%] h-[96%]"><ChatComponent chatId={openChat.chatId} chatName={openChat.chatName} setOpenChat={setOpenChat} /></div>
              : <div className="bgGridThing w-full h-full"></div>
            }
          </div>
        }
      </main>
    </>
  );
};

export default Home;
