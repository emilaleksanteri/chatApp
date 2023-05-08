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
      <main className="flex h-screen w-screen bg-zinc-100 flex flex-col items-center">
        <div className="text-zinc-100">
        {
        !user.isSignedIn && 
          <div className="w-screen h-screen homeBg flex flex-col justify-center items-center">
            <h1 className="sm:text-4xl text-2xl font-bold mb-16 -mt-20 sm:mb-10">Interactive Chatting 💬</h1>
            <SignInButton mode="modal">
              <button className="text-zinc-800 lg:p-10 sm:p-5 p-4 signInGradient lg:w-[40%] sm:w-[60%] w-[70%] rounded-xl sm:text-3xl text-2xl font-bold drop-shadow-xl">
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
          <div className="flex sm:flex-row flex-col h-full w-full">
            <div className={!!openChat.open ? "lg:w-[40%] sm:w-[70%] w-100% h-full sm:inline hidden" : "lg:w-[40%] sm:w-[70%] w-100% h-full"}>
              <ChatsNavigation openChat={openChat} setOpenChat={setOpenChat} />
            </div>
            { openChat.open
              ? <div className="lg:w-[100%] h-full w-full"><ChatComponent chatId={openChat.chatId} chatName={openChat.chatName} setOpenChat={setOpenChat} /></div>
              : <div className="bgGridThing w-full h-full sm:flex hidden"></div>
            }
          </div>
        }
      </main>
    </>
  );
};

export default Home;
