import { type NextPage } from "next";
import Head from "next/head";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Connect as ChatComponent } from "../components/wsChatComponent"
import { Chats as ChatsNavigation } from "../components/chatsNavigation"
import { AboutChat } from "../components/aboutChat"


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
      <main className="flex h-[95vh] w-screen bg-zinc-100 flex flex-col items-center">
        <div className="text-zinc-100">
        {
        !user.isSignedIn && 
          <div className="relative w-screen h-screen homeBg flex flex-col justify-center items-center">
            <h1 className="sm:text-4xl text-2xl font-bold mb-10 -mt-20 sm:mb-10">Interactive Chatting 💬</h1>
            <SignInButton mode="modal">
              <div className="lg:w-[40%] sm:w-[60%] w-[70%] rounded-xl p-1 signInGradient hover:bg-transparent">
                <button className="transition ease-in-out bg-gradient-to-r bg-green-500 w-[100%] p-8 hover:-translate-y-1 hover:scale-105 hover:bg-green-400 duration-200 rounded-xl sm:text-3xl hover:bg text-2xl font-bold drop-shadow-lg hover:drop-shadow-xl">
                  <span>Sign in</span>
                </button>
              </div>
            </SignInButton>
          </div>
        }
        </div>
        { !!user.isSignedIn &&
        <div className="flex flex-col h-[100%] w-full">
          <SignOutButton>
            <button className="btn w-screen signOutGradient p-2 text-zinc-800 font-bold">
              SIGN OUT
            </button>
          </SignOutButton>
          <div className="flex md:flex-row flex-col h-full w-full">
            <div className={!!openChat.open ? "lg:w-[40%] md:w-[70%] w-100% h-full md:inline hidden" : "lg:w-[40%] md:w-[70%] w-100% h-full"}>
              <ChatsNavigation openChat={openChat} setOpenChat={setOpenChat} />
            </div>
            { openChat.open && openChat.chatId !== "about" &&
              <div className="lg:w-[100%] h-full w-full"><ChatComponent chatId={openChat.chatId} chatName={openChat.chatName} setOpenChat={setOpenChat} /></div>
            }
            {
              openChat.open && openChat.chatId === "about" &&
              <div className="lg:w-[100%] h-full w-full"><AboutChat setOpenChat={setOpenChat} /></div>
            }
            { !openChat.open &&
              <div className="bgGridThing w-full h-full md:flex hidden"></div>
            }
          </div>
        </div> 
        }
      </main>
    </>
  );
};

export default Home;
