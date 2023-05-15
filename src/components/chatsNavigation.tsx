import { api } from "~/utils/api";
import { useUser } from "@clerk/nextjs";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HowTo } from "./howTo"
import { UserList } from "./userList"


export const Chats = (props: {openChat: {
    chatId: string
    open: boolean
  }, setOpenChat: Dispatch<SetStateAction<{
    chatId: string;
    open: boolean;
    chatName: string;
  }>>}) => {
    const {data, isLoading} = api.chats.getAll.useQuery()
    const [chats, setChats] = useState<typeof data>()
    const [filter, setFilter] = useState<typeof data>()
    const randomColours = ["stroke-red-500", "stroke-orange-500", "stroke-amber-500", "stroke-yellow-400", "stroke-lime-400", "stroke-green-400", "stroke-emerald-400", "stroke-teal-400", "stroke-cyan-400", "stroke-sky-400", "stroke-blue-500", "stroke-indigo-500", "stroke-violet-500", "stroke-purple-500", "stroke-fuchsia-500", "stroke-pink-500", "stroke-rose-400"]
    const items = new Array(20).fill(1)

    useEffect(()=> {
      if (!isLoading) {
        setChats(data)
        setFilter(data)
      }
    },[isLoading])

    if (isLoading) {
      return (
        <div className="bg-zinc-100 border-2 overflow-y-scroll max-h-[96vh]">
        <CreateChat />
        <div className="flex flex-col mt-2 p-1">
          {items?.map(() => (
            <div key={Math.floor(Math.random() * 1000000)} className="flex w-full items-center justify-center border-2 border-zinc-300 hover:bg-zinc-200 rounded-md">
              <div className="loaderGradient rounded-full p-7"></div>
              <button className="flex flex-col text-left py-2 pl-8 w-full">
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
      <div className="bg-zinc-100 h-[96vh] border-2">
        <CreateChat />
        <div className="w-full flex items-center justify-center">
          <input type="text" placeholder="search chats.." className="p-2 bg-zinc-100 border-2 border-zinc-300 w-[81%] outline-none rounded-lg"
          onChange={(e) => {setFilter(chats?.filter((chat) => chat.Chat.chatName.includes(e.target.value.toLowerCase())))}} />
        </div>
        
        <ul className="flex flex-col mt-2 overflow-auto p-1 gap-[1px]">
          {filter?.map((chat) => (
            <li key={chat.chatId}>
              <button className="flex w-full items-center justify-center border-2 border-zinc-300 hover:bg-zinc-200 rounded-md" onClick={() => props.setOpenChat({ chatId: chat.chatId, open: true, chatName: chat.Chat.chatName })}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={"w-10 h-10 m-4 stroke-1 fill-none " + randomColours[Math.floor(Math.random() * randomColours.length)]}>
                  <path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
                <div className="flex flex-col text-left py-2 pl-8 w-full">
                  <p className="text-xl font-bold tracking-wide">{chat.Chat.chatName}</p>
                  {
                    chat.Chat.messages[0]?.body
                    ? <p>{chat.Chat.messages[0]?.body && chat.Chat.messages[0]?.body.length < 20 
                        ? chat.Chat.messages[0]?.body
                        : chat.Chat.messages[0]?.body.slice(0, 19) + '...'}
                      </p>
                    : <p>New Chat 🎉</p>
                  }
                </div>
              </button>
            </li>
          ))}
              <HowTo setOpenChat={props.setOpenChat} />
        </ul>
      </div>
    )
  }
  
  const CreateChat = () => {
    const user = useUser()
    if (!user.user?.id) return <div/>
  
    const [open, setOpen] = useState(false)
  
    const [participants, setParticipants] = useState<Array<string>>([user?.user?.id, "AI"])
    const [chatName, setChatName] = useState("")
  
    const ctx = api.useContext()
  
    const { mutate } = api.chats.createChat.useMutation({
      onSuccess: () => {
        ctx.chats.invalidate()
        toast.success(`${chatName} created 🎉`)
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
            <button className="font-bold text-2xl w-[80%] text-center py-2 mt-3 rounded-lg border-2 border-zinc-500 hover:bg-green-300 flex justify-center items-center" onClick={() => setOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            </button>
          </div>
        }
        {
          !!open &&
          <div>
            <p className="font-bold text-2xl w-full text-center py-2">Create a chat:</p>
            <UserList participants={participants} setParticipants={setParticipants} currentMembers={undefined} />
            <div className="mt-4 flex flex-col items-center justify-center gap-4">
              <input value={chatName} type="text" onChange={(e) => setChatName(e.target.value)} className="w-[90%] p-1 bg-zinc-100 border-2 border-green-300 px-2 outline-none rounded-md" placeholder="Chat name..." />
              <div className="flex w-[90%] gap-2">
                <button className="w-full flex items-center justify-center bg-rose-400 rounded-lg drop-shadow-md" onClick={() => setOpen(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button type="submit" className="p-2 bg-green-300 w-full rounded-lg drop-shadow-md font-bold text-zinc-700 flex items-center justify-center" onClick={() => {
                  if (participants.length) {
                    mutate({chatName: chatName, participants: participants})
                  }
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
  
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    )
  
  }