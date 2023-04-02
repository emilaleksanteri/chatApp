import { type NextPage } from "next";
import Head from "next/head";
import { RouterOutputs, api } from "~/utils/api";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime"
import Image from 'next/image'
import { Loader } from "../components/loader"

dayjs.extend(relativeTime)

const PostMessageWizard = () => {
  const { user } = useUser()
  if (user) {
    return (
      <div className="flex items-center">
        <Image width={80} height={80} src={user.profileImageUrl} alt="Profile Picture" className="w-[80px] h-[80px] rounded-full drop-shadow-lg border-4 border-emerald-300" />
        <div className="ml-8 w-full">
          <div className="w-full flex items-center gap-8" >
            <input placeholder="message..." className="w-[90%] p-4 overflow-scroll bg-inherit border-2 border-zinc-300 rounded-2xl outline-none" />
            <button className="bg-emerald-300 text-xl p-4 rounded-2xl drop-shadow-lg pl-6 pr-6 font-bold">Send</button>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// very cool
type MessageWithUser = RouterOutputs["message"]["getAll"][0]
const MessageView = (message: MessageWithUser) => {
  const user = useUser()
  if (!message.author) return null

  if (user.isSignedIn) {
    return (
      <div>
        <div className="flex items-center gap-4">
          {message.author?.id !== user.user.id && <Image width={48} height={48} src={message.author.profileImageUrl} alt="User" className="w-12 h-12 rounded-full text-xs drop-shadow-lg" />}
          <div
            className="p-4 bg-emerald-300 rounded-2xl flex flex-col items-center w-fit drop-shadow-xl flex gap-4">
            <p className="text-lg" >{message.message.body}</p>
          </div>
          {message.author?.id === user.user.id && <Image width={48} height={48} src={message.author.profileImageUrl} alt="profile" className="w-12 h-12 rounded-full text-xs drop-shadow-lg" />}
        </div>
        <p className="text-[11px] text-zinc-400 mt-2 ml-1">{dayjs(message.message.sentAt).fromNow()}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <Image width={48} height={48} src={message.author.profileImageUrl} alt="profile" className="w-12 h-12 rounded-full text-xs drop-shadow-lg" />
        <div
          className="p-4 bg-emerald-300 rounded-2xl flex flex-col items-center w-fit drop-shadow-xl flex gap-4">
          <p className="text-lg" >{message.message.body}</p>
        </div>
      </div>
      <p className="text-[11px] text-zinc-400 mt-2">{dayjs(message.message.sentAt).fromNow()}</p>
    </div>
  )
}


const Home: NextPage = () => {
  const user = useUser()
  const {data, isLoading} = api.message.getAll.useQuery()

  if (!user) return null

  if (isLoading) return <div className="bg-zinc-900 w-screen h-screen flex items-center justify-center"><Loader widthHeight="w-[100px] h-[100px]" /></div>

  return (
    <>
      <Head>
        <title>ChatApp</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen bg-zinc-900 flex flex-col items-center">
        <div className="text-zinc-100 p-2">
        {
        !user.isSignedIn && 
          <SignInButton mode="modal">
            <button className="btn">
              Sign in
            </button>
          </SignInButton>
        }
        {
          !!user.isSignedIn &&
          <SignOutButton>
            <button className="btn">
              Sign Out
            </button>
          </SignOutButton>
        }
        </div>
        <section className="relative w-[50%] bg-zinc-200 h-96 overflow-scroll rounded-2xl grid">
          <div className="flex flex-col gap-8 bottom-10 self-end mb-4">
            {data?.map((message) => {
              if (user.isSignedIn && user.user.id === message.author?.id) {
               return (
                <div className="flex flex-row-reverse">
                  <div className="mr-6"><MessageView key={message.message.id} {...message} /></div>
                </div>
                
              )}

              if (user.isSignedIn && user.user.id !== message.author?.id) {
                return (
                  <div>
                    <div className="ml-6"><MessageView key={message.message.id} {...message} /></div>
                  </div>
                 
               )}

              return (
                <div>
                  <div className="ml-6"><MessageView key={message.message.id} {...message} /></div>
                </div>
              )
            })}
          </div>
        </section>
        {user.isSignedIn &&
        <div className="bg-zinc-200 mt-4 w-[50%] p-4 rounded-2xl">
          <PostMessageWizard />
        </div>
        }
      </main>
    </>
  );
};

export default Home;
