import { type NextPage } from "next";
import Head from "next/head";
import { RouterOutputs, api } from "~/utils/api";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime"
import Image from 'next/image'
import { Loader } from "../components/loader"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
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
    <div className="bg-zinc-100 rounded-xl p-2 w-46 outline outline-1">
      <button className="flex gap-2 justify-between items-center p-2" onClick={() => setShowEffects(!showEffects)}>
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

const PostMessageWizard = (props: {sendMessage: (input: string) => void, theyTyping: (user: string) => void, typing: string, chatId: string}) => {
  const { user } = useUser()
  const [input, setInput] = useState("")
  const [inputLength, setInputLength] = useState(0)

  const ctx = api.useContext()

  const { mutate, isLoading: isPosting } = api.message.create.useMutation({
    onSuccess: () => {
      ctx.message.getAll.invalidate()
      ctx.chats.getAll.invalidate()
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
      <div className="flex items-center w-full">
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
                    mutate({ body: input, chatId: props.chatId });
                  }
                }
              }}
            />
            <button className="bg-emerald-300 text-xl p-4 rounded-2xl drop-shadow-lg pl-6 pr-6 font-bold"
              onClick={() => {
                mutate({ body: input, chatId: props.chatId })
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

const Messages = (props: {listenToMessages: () => void, whoIsTyping: () => void, typing: string, chatId: string}) => {
  const user = useUser()
  const {data, isLoading} = api.message.getAll.useQuery(props.chatId)

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    props.listenToMessages()
    props.whoIsTyping()
  }, [])


  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior: 'smooth', block: 'end',});
  }, [data])


  if (isLoading) return <div className="relative w-full bgCgat overflow-scroll h-full flex items-center justify-center"><Loader widthHeight="w-[100px] h-[100px]" /></div>

  return (
      <section className="relative w-full bgCgat overflow-scroll grid h-full">
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

const Connect = (props: {chatId: string, chatName: string, setOpenChat: Dispatch<SetStateAction<{
  chatId: string;
  open: boolean;
  chatName: string;
}>>}) => {
  const URL = getBaseUrl()
  const wsConnectionChat = new WebSocket(`${URL}/chat`)
  const wsConnectionTyping = new WebSocket(`${URL}/typing`)
  const wsConnectionAudio = new WebSocket(`${URL}/sounds`)

  return (
    <ConnectionComponent wsConnectionChat={wsConnectionChat} wsConnectionTyping={wsConnectionTyping} wsConnectionAudio={wsConnectionAudio} chatId={props.chatId} chatName={props.chatName} setOpenChat={props.setOpenChat} />
  )
}

const ConnectionComponent = (props: {
  wsConnectionChat: WebSocket,
  wsConnectionTyping: WebSocket,
  wsConnectionAudio: WebSocket,
  chatId: string,
  chatName: string,
  setOpenChat: Dispatch<SetStateAction<{
    chatId: string;
    open: boolean;
    chatName: string;
}>>
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

  const [aboutOpen, setAboutOpen] = useState(false)

  const sendMessage = (input: string): void => {
    props.wsConnectionChat.send(input)
    setTyping("")
  }

  const listenToMessages = (): void => {
    props.wsConnectionChat.onerror = e => console.log(e)
    props.wsConnectionChat.onmessage = msg => {
      ctx.message.getAll.invalidate()
      ctx.chats.getAll.invalidate()
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

  // get members for chat settings view
  const {data, isLoading} = api.chats.getChatMembers.useQuery(props.chatId)
  const chatInfo = api.chats.getChatData.useQuery(props.chatId)
  const { mutate, isLoading: isPosting } = api.chats.leaveChat.useMutation({
    onSuccess: () => {
      ctx.chats.getAll.invalidate()
      props.setOpenChat({ chatId: "", open: false, chatName: "" })
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

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-zinc-100 text-2xl font-bold pl-2 drop-shadow-lg z-10 outline outline-1 outline-zinc-300 flex gap-2 items-center">
        <button className="p-2" onClick={() => props.setOpenChat({ chatId: "", open: false, chatName: "" })}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-10 h-10">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button className="p-2 ml-10" onClick={() => setAboutOpen(true)}>{props.chatName}</button>
      </div>
      {
        !!aboutOpen && chatInfo.data && !chatInfo.isLoading && data &&
        <div className="relative w-full bg-zinc-100 overflow-scroll flex flex-col h-full items-center">
          <p className="w-[60%] text-3xl mt-10">Members:</p>
          <div className="w-[60%] mt-4 drop-shadow-xl p-2 overflow-scroll h-fit rounded-xl z-10 outline outline-2 outline-green-300">
            {
             !isLoading &&
             <div className="">
              {
                data?.map((member) => (
                  !!member.user &&
                    <div key={member.user.id} className="flex items-center gap-4 p-2">
                      <Image width={80} height={80} src={member.user?.profileImageUrl} alt="profile" className="w-[80px] h-[80px] rounded-full text-xs drop-shadow-lg" />
                      <p className="text-3xl">{member.user.username}</p>
                    </div>
                ))
              }
             </div>
            }
          </div>
          <p className="w-[60%] text-3xl mt-10">{"Created at: " + chatInfo.data.createdAt.toDateString()}</p>
          <button onClick={() => {mutate({ chatId: props.chatId, numOfUsers: data?.length })}} 
            className="mt-10 w-[60%] p-2 bg-rose-400 rounded-lg drop-shadow-lg text-2xl font-bold text-zinc-800">
              LEAVE
          </button>
        </div>
      }
      {
        !aboutOpen &&
        <div className="h-[82%]">
          <Messages listenToMessages={listenToMessages} whoIsTyping={whoIsTyping} typing={typing} chatId={props.chatId} />
          <div className="flex flex-col w-full items-center">
            <div className="bg-zinc-100 p-4 w-full">
              <PostMessageWizard sendMessage={sendMessage} theyTyping={theyTyping} typing={typing} chatId={props.chatId} />
            </div>
            <div className="absolute right-[0.5%] top-[12%] z-20 drop-shadow-lg">
              <AudioEffects effect={effect} sounds={sounds} sendSoundToAll={sendSoundToAll} setEffect={setEffect} />
            </div>
          </div>
        </div>
      }
    </div>
  )

}

const Chats = (props: {openChat: {
  chatId: string
  open: boolean
}, setOpenChat: Dispatch<SetStateAction<{
  chatId: string;
  open: boolean;
  chatName: string;
}>>}) => {
  const {data, isLoading} = api.chats.getAll.useQuery()
  const randomColours = ["stroke-red-500", "stroke-orange-500", "stroke-amber-500", "stroke-yellow-400", "stroke-lime-400", "stroke-green-400", "stroke-emerald-400", "stroke-teal-400", "stroke-cyan-400", "stroke-sky-400", "stroke-blue-500", "stroke-indigo-500", "stroke-violet-500", "stroke-purple-500", "stroke-fuchsia-500", "stroke-pink-500", "stroke-rose-400"]
  const items = new Array(20).fill(1)
  if (isLoading) {
    return (
      <div className="bg-zinc-100 h-full overflow-auto border-2">
      <CreateChat />
      <div className="flex flex-col mt-2 p-1">
        {items?.map(() => (
          <div className="flex w-full items-center justify-center outline outline-1 outline-zinc-300 hover:bg-zinc-200">
            <div className="loaderGradient rounded-full p-7"></div>
            <button key={Math.floor(Math.random() * 1000000)} className="flex flex-col text-left py-2 pl-8 w-full">
              <p className="text-xl font-bold tracking-wide loaderGradient p-4 w-[60%] rounded-xl"></p>
              <p className="text-xl font-bold tracking-wide loaderGradient p-2 mt-1 w-[60%] rounded-xl"></p>
            </button>
          </div>
        ))}
      </div>
    </div>
    )
  }

  return (
    <div className="bg-zinc-100 h-full border-2">
      <CreateChat />
      <div className="flex flex-col mt-2 overflow-auto p-1">
        {data?.map((chat) => (
          <div className="flex w-full items-center justify-center outline outline-1 outline-zinc-300 hover:bg-zinc-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={"w-10 h-10 m-4 stroke-1 fill-none " + randomColours[Math.floor(Math.random() * randomColours.length)]}>
              <path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>

            <button key={chat.chatId} className="flex flex-col text-left py-2 pl-8 w-full" onClick={() => props.setOpenChat({ chatId: chat.chatId, open: true, chatName: chat.Chat.chatName })}>
              <p className="text-xl font-bold tracking-wide">{chat.Chat.chatName}</p>
              {
                chat.Chat.messages[0]?.body
                ? <p>{chat.Chat.messages[0]?.body && chat.Chat.messages[0]?.body.length < 20 
                    ? chat.Chat.messages[0]?.body
                    : chat.Chat.messages[0]?.body.slice(0, 19) + '...'}
                  </p>
                : <p>New Chat 🎉</p>
              }
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const UsersList = (props: { participants: string[], setParticipants: Dispatch<SetStateAction<string[]>>}) => {
  const {data, isLoading} = api.users.getAll.useQuery()
  const placeHolder = new Array(10).fill(0)
  if (isLoading) {
    return (
      <div className="overflow-auto w-full h-20">
          {placeHolder?.map(() => (
            <button key={Math.floor(Math.random() * 10000000)} className="flex gap-4 bg-zinc-100 w-full items-cetner p-2 border border-2 hover:bg-zinc-200">
              <div className="w-6 h-6 loaderGradient p-4 rounded-full"></div>
              <p className="loaderGradient w-[60%] rounded-lg p-2"></p>
            </button>
          ))}
      </div>
    )
  }
  return (
      <div className="overflow-auto w-full h-20">
          {data?.map((user) => (
            <button key={user.id} className={props.participants.includes(user.id) ? "flex gap-4 bg-green-300 w-full items-cetner p-2" : "flex gap-4 bg-zinc-100 w-full items-cetner p-2 border border-2 hover:bg-zinc-200"} onClick={() => {
              if (props.participants.includes(user.id)) {
                props.setParticipants(props.participants.filter((usr) => usr !== user.id))
              } else {
                props.setParticipants(props.participants.concat(user.id))
              }
            }}>
              <Image width={48} height={48} src={user.profileImageUrl} alt="profile" className="w-6 h-6 rounded-full text-xs drop-shadow-lg" />
              <p>{user.username}</p>
            </button>
          ))}
      </div>
  )
}

const CreateChat = () => {
  const user = useUser()
  if (!user.user?.id) return <div/>

  const [open, setOpen] = useState(false)

  const [participants, setParticipants] = useState<Array<string>>([user?.user?.id])
  const [chatName, setChatName] = useState("")

  const ctx = api.useContext()

  const { mutate } = api.chats.createChat.useMutation({
    onSuccess: () => {
      ctx.chats.invalidate()
      setChatName("")
      setParticipants([user?.user?.id])
    },
    onError: (e) => {
      toast.error("Someting went wrong.")
    }
  })

  return (
    <div className="pt-2 pb-4">
      {
        !open &&
        <div className="flex justify-center">
          <button className="font-bold text-2xl w-[80%] text-center py-2 mt-3 rounded-lg outline outline-1 hover:bg-green-300 flex justify-center items-center" onClick={() => setOpen(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          </button>
        </div>
      }
      {
        !!open &&
        <div>
          <p className="font-bold text-2xl w-full text-center py-2">Create a chat:</p>
          <UsersList participants={participants} setParticipants={setParticipants} />
          <div className="mt-4 flex flex-col items-center justify-center gap-4">
            <input value={chatName} type="text" onChange={(e) => setChatName(e.target.value)} className="w-[90%] p-1 bg-zinc-100 outline outline-1 outline-green-300 px-2 rounded-md" placeholder="Chat name..." />
            <div className="flex w-[90%] gap-2">
              <button className="w-full flex items-center justify-center bg-rose-400 rounded-lg drop-shadow-md" onClick={() => setOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button type="submit" className="p-2 bg-green-300 w-full rounded-lg drop-shadow-md font-bold text-zinc-700 flex items-center justify-center" onClick={() => {
                if (participants.length) {
                  mutate({chatName: chatName, participants: participants})
                }
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>

              </button>
            </div>
          </div>
        </div>
      }
    </div>
  )

}


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
      <main className="flex min-h-screen bg-zinc-900 flex flex-col items-center">
        <div className="text-zinc-100">
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
            <button className="btn w-screen bg-green-300 p-2 text-zinc-800 font-bold">
              SIGN OUT
            </button>
          </SignOutButton>
        }
        </div>
        { !!user.isSignedIn &&
          <div className="flex w-screen h-screen">
            <div className="w-[40%] h-[96%]">
              <Chats openChat={openChat} setOpenChat={setOpenChat} />
            </div>
            { openChat.open
              ? <div className="w-[100%] h-[96%]"><Connect chatId={openChat.chatId} chatName={openChat.chatName} setOpenChat={setOpenChat} /></div>
              : <div className="bgGridThing w-full h-full"></div>
            }
          </div>
        }
      </main>
    </>
  );
};

export default Home;
