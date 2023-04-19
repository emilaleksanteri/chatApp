import { type NextPage } from "next";
import Head from "next/head";
import { RouterOutputs, api } from "~/utils/api";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime"
import Image from 'next/image'
import { Loader } from "../components/loader"
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useSound from 'use-sound';
import angry from "../../public/static/angry.mp3"
import hehe from "../../public/static/hehe.mp3"
import running from "../../public/static/running.mp3"
import slurp from "../../public/static/slurp.mp3"
import surprise from "../../public/static/surprise.mp3"
import { ReturnedValue } from "use-sound/dist/types";

const getBaseUrl = () => {
  if (
    process.env.NEXT_PUBLIC_WEBSOCKET_URL &&
    process.env.NODE_ENV !== 'development'
  )
    return `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}`; // SSR should use vercel url
  return `ws://localhost:8080`; // dev SSR should use localhost
};

dayjs.extend(relativeTime)


const AudioEffects = (props: {effect: number | undefined, sounds: {
  hook: ReturnedValue;
  name: string;
}[], sendSoundToAll: (name: string) => void, setEffect: any}) => {
  const [showEffects, setShowEffects] = useState(false)

  useEffect(() => {
    // nice 0th index in JS is undefined
    if (props.effect || props.effect === 0) {
      const play = props.sounds[props.effect]?.hook[0]
      if (play) {
        try {
          play()
          props.setEffect(undefined)
        } catch {
          console.log('error')
        }
      }
    }
  }, [props.effect])


  return (
    <div className="bg-zinc-200 rounded-xl p-2 w-46">
      <button className="flex gap-2 justify-between mb-2 p-2" onClick={() => setShowEffects(!showEffects)}>
        <p className="font-bold uppercase ml-4">Sound Effects</p>
        {
          showEffects
          ?
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 mr-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
          :
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 mr-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>

        }
        

      </button>
      {
        showEffects
        ? <div className="grid grid-cols-2 items-stretch gap-2">
            {props.sounds.map((sound) => (
              <button key={sound.name} className="bg-zinc-200 text-zinc-800 font-bold p-2 uppercase hover:bg-emerald-300 hover:drop-shadow-xl rounded-xl hover:outline hover:outline-1" onClick={() => {
                if (!props.effect) {
                  props.sendSoundToAll(sound.name)
                }
              }}>{sound.name}</button>
            ))}
          </div>
        : null
      }
    </div>
  )
}

const PostMessageWizard = (props: {sendMessage: (input: string) => void, theyTyping: (user: string) => void, typing: string}) => {
  const { user } = useUser()
  const [input, setInput] = useState("")
  const [inputLength, setInputLength] = useState(0)

  const ctx = api.useContext()

  const { mutate, isLoading: isPosting } = api.message.create.useMutation({
    onSuccess: () => {
      ctx.message.getAll.invalidate()
      props.sendMessage(input)
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
              onChange={(e) => {
                  setInput(e.target.value)
                  if (props.typing.length === 0 && inputLength < input.length) {
                      setInputLength(input.length)
                      props.theyTyping(user.username ? user.username: 'anonymous')
                  }
                }
              }
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
              onClick={() => {
                mutate({ body: input })
              }}
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
        {message.author?.id !== user.user.id
          ? <p className="text-[11px] text-zinc-400 mt-2 ml-1 text-left">{dayjs(message.message.sentAt).fromNow()}</p>
          : <p className="text-[11px] text-zinc-400 mt-2 ml-1 text-right">{dayjs(message.message.sentAt).fromNow()}</p>
        }
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

const Messages = (props: {listenToMessages: () => void, whoIsTyping: () => void, typing: string}) => {
  const user = useUser()
  const {data, isLoading} = api.message.getAll.useQuery()

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    props.listenToMessages()
    props.whoIsTyping()
  }, [])


  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior: 'smooth', block: 'end',});
  }, [data])


  if (isLoading) return <div className="bg-zinc-900 w-screen h-[300px] flex items-center justify-center"><Loader widthHeight="w-[100px] h-[100px]" /></div>

  return (
    <section className="relative w-[50%] bg-zinc-200 h-[700px] overflow-scroll rounded-2xl grid">
    <div className="flex flex-col gap-8 bottom-10 self-end -mb-2 mt-4">
      {data?.map((message) => {
        if (user.isSignedIn && user.user.id === message.author?.id) {
         return (
          <div className="flex flex-row-reverse" key={message.message.id}>
            <div className="mr-6 ml-6"><MessageView key={message.message.id} {...message} /></div>
          </div>
          
        )}

        if (user.isSignedIn && user.user.id !== message.author?.id) {
          return (
            <div key={message.message.id} >
              <div className="ml-6 mr-6"><MessageView key={message.message.id} {...message} /></div>
            </div>
           
         )}

        return (
          <div key={message.message.id} >
            <div className="ml-6 mr-6"><MessageView key={message.message.id} {...message} /></div>
          </div>
        )
      })}
      <div>
        <p className="text-lg text-zinc-500 ml-2">{props.typing}</p>
      </div>
      <div ref={bottomRef} />
    </div>
  </section>
  )
}

const Connect = () => {
  const URL = getBaseUrl()
  const wsConnectionChat = new WebSocket(`${URL}/chat`)
  const wsConnectionTyping = new WebSocket(`${URL}/typing`)
  const wsConnectionAudio = new WebSocket(`${URL}/sounds`)

  return (
    <ConnectionComponent wsConnectionChat={wsConnectionChat} wsConnectionTyping={wsConnectionTyping} wsConnectionAudio={wsConnectionAudio} />
  )
}

const ConnectionComponent = (props: {
  wsConnectionChat: WebSocket,
  wsConnectionTyping: WebSocket,
  wsConnectionAudio: WebSocket
}) => {
  const user = useUser()

  const [typing, setTyping] = useState('')

  const ctx = api.useContext()

  const [effect, setEffect] = useState<number | undefined>(undefined)
  const sounds = [
    {hook: useSound(angry), name: "angry"},
    {hook: useSound(hehe), name: "hehe"}, 
    {hook: useSound(running), name: "running"}, 
    {hook: useSound(slurp), name: "slurp"},
    {hook: useSound(surprise), name: "surprise"}
  ]

  const sendMessage = (input: string): void => {
    props.wsConnectionChat.send(input)
    setTyping("")
  }

  const listenToMessages = (): void => {
    props.wsConnectionChat.onerror = e => console.log(e)
    props.wsConnectionChat.onmessage = msg => {
      ctx.message.getAll.invalidate()
    }
  }

  const intreval = setInterval(() => {
    setTyping("")
  }, 4000)

  const theyTyping = (user: string): void => {
    setTimeout(() => {
      props.wsConnectionTyping.send(user)
    }, 300)
  }

  const whoIsTyping = (): void => {
    props.wsConnectionTyping.onmessage = (msg) => {
      const user = msg.data + ' is typing...'
      setTyping(user)
    }
  }

  const sendSoundToAll = (name: string): void => {
    props.wsConnectionAudio.send(name)
  }

  props.wsConnectionAudio.addEventListener("message", (event) => {
    props.wsConnectionAudio.onmessage = msg => {
      if (!effect) {
        const soundIdx = sounds.findIndex(sound => sound.name === msg.data)
        setEffect(soundIdx)
      }
    }
  })


  return (
    <div className="w-full flex flex-col justify-center items-center">
      <Messages listenToMessages={listenToMessages} whoIsTyping={whoIsTyping} typing={typing} />
        {user.isSignedIn &&
        <div className="flex flex-col w-full items-center gap-6">
          <div className="bg-zinc-200 mt-4 w-[50%] p-4 rounded-2xl">
            <PostMessageWizard sendMessage={sendMessage} theyTyping={theyTyping} typing={typing} />
          </div>
          <div className="absolute right-[8%] top-[4%]">
            <AudioEffects effect={effect} sounds={sounds} sendSoundToAll={sendSoundToAll} setEffect={setEffect} />
          </div>
        </div>
        }
    </div>
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
        <Connect />
      </main>
    </>
  );
};

export default Home;
