import { type NextPage } from "next";
import Head from "next/head";
import { RouterOutputs, api } from "~/utils/api";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime"
import Image from 'next/image'
import { Loader } from "../components/loader"
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

dayjs.extend(relativeTime)

const PostMessageWizard = () => {
  const wsConnection = new WebSocket("ws://localhost:3003")
  const { user } = useUser()
  const [input, setInput] = useState("")

  const ctx = api.useContext()

  const { mutate, isLoading: isPosting } = api.message.create.useMutation({
    onSuccess: () => {
      ctx.message.getAll.invalidate()
      wsConnection.send(input)
      setInput("")
    },
    onError: (e) => {
      const errorMsg = e.data?.zodError?.fieldErrors.body
      if (errorMsg && errorMsg[0]) {
        toast.error(errorMsg[0])
      } else {
        toast.error("Someting went wrong.")
      }
    }
  })

  if (user) {
    return (
      <div className="flex items-center">
        <Image width={80} height={80} src={user.profileImageUrl} alt="Profile Picture" className="w-[80px] h-[80px] rounded-full drop-shadow-lg border-4 border-emerald-300" />
        <div className="ml-8 w-full">
          <div className="w-full flex items-center gap-8" >
            <textarea placeholder="message..." className="w-[90%] p-4 overflow-scroll bg-inherit border-2 border-zinc-300 rounded-2xl outline-none"
              value={input}
              name="text"
              onChange={(e) => setInput(e.target.value)}
              rows={input.split(/\r|\n/).length}
              id="text"
              autoFocus
              disabled={isPosting}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (input !== "") {
                    mutate({ body: input });
                  }
                }
              }}
            />
            <button className="bg-emerald-300 text-xl p-4 rounded-2xl drop-shadow-lg pl-6 pr-6 font-bold"
              onClick={() => mutate({ body: input })}
            >
              {isPosting && <Loader widthHeight="h-[24px] w-[24px]" />}
              {!isPosting &&
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              }
            </button>
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
          {message.author.id === user.user.id &&
            <div
              className="p-4 bg-emerald-300 rounded-2xl flex flex-col items-center w-fit drop-shadow-xl flex gap-4">
              <p className="text-lg" >{message.message.body}</p>
            </div>
          }
          {message.author.id !== user.user.id &&
            <div
              className="p-4 bg-zinc-400 rounded-2xl flex flex-col items-center w-fit drop-shadow-xl flex gap-4">
              <p className="text-lg" >{message.message.body}</p>
            </div>
          }
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
          className="p-4 bg-zinc-300 rounded-2xl flex flex-col items-center w-fit drop-shadow-xl flex gap-4">
          <p className="text-lg" >{message.message.body}</p>
        </div>
      </div>
      <p className="text-[11px] text-zinc-400 mt-2">{dayjs(message.message.sentAt).fromNow()}</p>
    </div>
  )
}

type ScrollBottom = () => void

const Messages = () => {
  const ctx = api.useContext()
  const wsConnection = new WebSocket("ws://localhost:3003")
  const user = useUser()
  const {data, isLoading} = api.message.getAll.useQuery()
  const [ws, setWs] = useState<WebSocket | null >(null)

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wsConnection.onerror = e => console.log(e)
    wsConnection.onopen = () => setWs(wsConnection)
    wsConnection.onmessage = msg => {
      ctx.message.getAll.invalidate()
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior: 'smooth', block: 'end',});
  }, [data])


  if (isLoading) return <div className="bg-zinc-900 w-screen h-screen flex items-center justify-center"><Loader widthHeight="w-[100px] h-[100px]" /></div>

  return (
    <section className="relative w-[50%] bg-zinc-200 h-96 overflow-scroll rounded-2xl grid">
    <div className="flex flex-col gap-8 bottom-10 self-end mb-4">
      {data?.map((message) => {
        if (user.isSignedIn && user.user.id === message.author?.id) {
         return (
          <div className="flex flex-row-reverse" key={message.message.id}>
            <div className="mr-6"><MessageView key={message.message.id} {...message} /></div>
          </div>
          
        )}

        if (user.isSignedIn && user.user.id !== message.author?.id) {
          return (
            <div key={message.message.id} >
              <div className="ml-6"><MessageView key={message.message.id} {...message} /></div>
            </div>
           
         )}

        return (
          <div key={message.message.id} >
            <div className="ml-6"><MessageView key={message.message.id} {...message} /></div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  </section>
  )
}


const Home: NextPage = () => {
  const user = useUser()

  if (!user.isLoaded) return <div/>


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
        <Messages />
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
