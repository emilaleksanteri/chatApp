import { RouterOutputs, api } from "~/utils/api";
import { useUser } from "@clerk/nextjs";
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
import { AboutChatPage } from "./aboutChatPage"

const getBaseUrl = () => {
  if (
    process.env.NEXT_PUBLIC_WEBSOCKET_URL &&
    process.env.NODE_ENV !== 'development'
  )
    return `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}`; // SSR should use vercel url
  return `${process.env.NEXT_PUBLIC_DEV_WS_URL}`; // dev SSR should use localhost
};

dayjs.extend(relativeTime)


const AudioEffects = (props: {effect: number | undefined, sounds: {
    hook: ReturnedValue;
    name: string;
  }[], sendSoundToAll: (name: string, chatId: string) => void, setEffect: any, chatId: string}) => {
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
      <div className={!showEffects ? "bg-zinc-100 rounded-full p-2 w-46 drop-shadow-md" : "bg-zinc-100 rounded-xl p-2 w-46 drop-shadow-md"}>
        <button className="flex gap-2 justify-between items-center p-2" onClick={() => setShowEffects(!showEffects)}>
          {
            showEffects
            ?
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <p className="font-bold uppercase ml-4">Sound Effects</p>
            </div>
            :
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>


          }
          
  
        </button>
        {
          showEffects
          ? <div className="grid grid-cols-2 items-stretch gap-2">
              {props.sounds.map((sound) => (
                <button key={sound.name} className="bg-zinc-200 text-zinc-800 font-bold border-2 border-zinc-200 p-2 uppercase hover:bg-emerald-300 hover:drop-shadow-xl rounded-xl hover:border-zinc-900" onClick={() => {
                  if (!props.effect) {
                    props.sendSoundToAll(sound.name, props.chatId)
                  }
                }}>{sound.name}</button>
              ))}
            </div>
          : null
        }
      </div>
    )
  }
  
  const PostMessageWizard = (props: {sendMessage: (input: string) => void, theyTyping: (user: string, chatId: string) => void, typing: string, chatId: string}) => {
    const { user } = useUser()
    const [input, setInput] = useState("")
    const [inputLength, setInputLength] = useState(0)
    const [aiCall, setAiCall] = useState("")
  
    const ctx = api.useContext()
  
    const { mutate, isLoading: isPosting } = api.message.create.useMutation({
      onSuccess: () => {
        ctx.message.getAll.invalidate()
        ctx.chats.getAll.invalidate()
        props.sendMessage(props.chatId)
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

    const { mutate: aiPost, isLoading: processing } = api.message.aiMessage.useMutation({
      onSuccess: () => {
        ctx.message.getAll.invalidate()
        ctx.chats.getAll.invalidate()
        props.sendMessage(props.chatId)
        setAiCall("")
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
        <div className="flex items-center w-full h-full p-2 border-2">
          <Image width={80} height={80} src={user.profileImageUrl} alt="Profile Picture" className="sm:w-[80px] sm:h-[80px] sm:inline hidden rounded-full drop-shadow-lg border-4 border-emerald-300" />
          <div className="sm:ml-8 ml-4 w-full">
            <div className="w-full flex items-center sm:gap-8 gap-2" >
              <textarea placeholder="message..." className="scroll sm:w-[90%] w-[100%] p-4 overflow-scroll bg-inherit resize-none border-2 border-zinc-300 rounded-2xl outline-none"
                value={input}
                name="text"
                onChange={(e) => {
                    setInput(e.target.value)
                    setAiCall(e.target.value)
                    if (props.typing !== typeof "string" && inputLength < input.length) {
                        setInputLength(input.length)
                        props.theyTyping(user.username ? user.username: 'anonymous', props.chatId)
                    }
                    if (!e.target.value) {
                      props.theyTyping("stop typing", props.chatId)
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
                      if (input.includes("@ai")) {
                        mutate({ body: input, chatId: props.chatId });
                        aiPost({ body: aiCall, chatId: props.chatId });
                      } else {
                        mutate({ body: input, chatId: props.chatId });
                        setAiCall("")
                      }
                    }
                  }
                }}
              />
              <button className="bg-emerald-300 text-xl sm:p-4 p-2 rounded-2xl drop-shadow-lg px-4 sm:mr-0 mr-2 sm:pl-6 sm:pr-6 font-bold"
                onClick={() => {
                  mutate({ body: input, chatId: props.chatId })
                }}
              >
                {isPosting && <Loader widthHeight="h-[24px] w-[24px]" />}
                {!isPosting &&
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
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
          <div className="flex items-start gap-4 sm:max-w-[60vw] max-w-[80vw]">
            {message.author?.id !== user.user.id && <Image width={48} height={48} src={message.author.profileImageUrl} alt="User" className="w-12 h-12 rounded-full text-xs drop-shadow-lg" />}
            {message.author.id === user.user.id &&
              <div
                className="p-3 bg-emerald-300 rounded-2xl flex flex-col items-center w-fit drop-shadow-xl gap-0">
                <p className="sm:text-lg text-md sm:max-w-[40vw] max-w-[55vw] text-ellipsis overflow-hidden text-left" >{message.message.body}</p>
                <p className="text-[11px] mt-2 ml-1 text-right w-full">{dayjs(message.message.sentAt).fromNow()}</p>
              </div>
            }
            {message.author.id !== user.user.id &&
              <div
                className="p-3 bg-zinc-400 rounded-2xl flex flex-col items-center w-fit drop-shadow-xl gap-0">
                <p className="sm:text-lg text-left text-md sm:max-w-[40vw] max-w-[55vw] text-ellipsis overflow-hidden" >{message.message.body}</p>
                <p className="text-[11px] mt-2 ml-1 text-left w-full">{dayjs(message.message.sentAt).fromNow()}</p>
              </div>
            }
            {message.author?.id === user.user.id && <Image width={48} height={48} src={message.author.profileImageUrl} alt="profile" className="w-12 h-12 rounded-full text-xs drop-shadow-lg" />}
          </div>
        </div>
      )
    } else return null

  }
  
  const Messages = (props: {listenToMessages: () => void, whoIsTyping: () => void, chatId: string}) => {
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
  
  
    if (isLoading) return <div className="relative w-full bgCgat overflow-y-scroll h-[78vh] flex items-center justify-center"><Loader widthHeight="w-[100px] h-[100px]" /></div>
  
    return (
        <section className="relative w-full bgCgat overflow-y-scroll grid h-[78vh] mt-[0.5%] md:w-[71.5vw] w-screen scroll">
          <div className="flex flex-col gap-8 self-end -mb-4 mt-4">
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
            <div ref={bottomRef} />
          </div>
        </section>
    )
  }
  
  // access chat here!!
  export const Connect = (props: {chatId: string, chatName: string, setOpenChat: Dispatch<SetStateAction<{
    chatId: string;
    open: boolean;
    chatName: string;
  }>>}) => {
    const URL = getBaseUrl()
    const wsConnectionChat = new WebSocket(`${URL}/chat?id=${props.chatId}`)
    const wsConnectionTyping = new WebSocket(`${URL}/typing?id=${props.chatId}`)
    const wsConnectionAudio = new WebSocket(`${URL}/sounds?id=${props.chatId}`)
  
    return (
      <div className="h-full">
        <ConnectionComponent wsConnectionChat={wsConnectionChat} wsConnectionTyping={wsConnectionTyping} wsConnectionAudio={wsConnectionAudio} chatId={props.chatId} chatName={props.chatName} setOpenChat={props.setOpenChat} />
      </div>
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
  
    const theyTyping = (user: string, chatId: string): void => {
      setTimeout(() => {
        props.wsConnectionTyping.send(JSON.stringify({ chatId: props.chatId, username: user }))
      }, 300)
    }
  
    const whoIsTyping = (): void => {
      props.wsConnectionTyping.onmessage = (msg) => {
        if (msg.data !== "stop typing") {
          const user = msg.data + ' is typing...'
          setTyping(user)
        } else {
          setTyping("")
        }
      }
    }
  
    const sendSoundToAll = (name: string, chatId: string): void => {
      props.wsConnectionAudio.send(JSON.stringify({ chatId: chatId, fileIdx: name }))
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
      onSuccess: (data) => {
        ctx.chats.getAll.invalidate()
        if (data === "left") {
          toast.success("Chat left")
        } else {
          toast.success("Chat deleted")
        }
        
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

    const loaderData = new Array(6).fill(0)
  
    return (
      <div className="w-full h-full flex flex-col">
        <div className="bg-zinc-100 text-2xl font-bold drop-shadow-lg z-10 outline outline-1 outline-zinc-300 flex gap-2 items-center justify-between">
          <button className="p-2" onClick={() => props.setOpenChat({ chatId: "", open: false, chatName: "" })}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex flex-col p-2 text-center">
            <p>{props.chatName}</p>
            <p className={ typing.length ? "text-xs font-light w-full text-center p-1" : "text-xs font-light w-full text-center p-1 text-zinc-100"}>{typing.length ? typing : "."}</p>
          </div>
          <button className="p-2" onClick={() => setAboutOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </button>
        </div>
        <AboutChatPage chatId={props.chatId} aboutOpen={aboutOpen} setOpenChat={props.setOpenChat} />
        {
          !aboutOpen &&
          <div className="h-full">
            <Messages listenToMessages={listenToMessages} whoIsTyping={whoIsTyping} chatId={props.chatId} />
            <div className="flex flex-col w-full items-center justify-center">
              <div className="bg-zinc-100 w-full">
                <PostMessageWizard sendMessage={sendMessage} theyTyping={theyTyping} typing={typing} chatId={props.chatId} />
              </div>
              <div className="absolute right-[0.5%] top-[20%] z-20 drop-shadow-lg">
                <AudioEffects effect={effect} sounds={sounds} sendSoundToAll={sendSoundToAll} setEffect={setEffect} chatId={props.chatId} />
              </div>
            </div>
          </div>
        }
      </div>
    )
  
  }
