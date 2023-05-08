import { api } from "~/utils/api";
import { useUser } from "@clerk/nextjs";
import Image from 'next/image'
import { Dispatch, SetStateAction, useState } from "react";
import toast from "react-hot-toast";


export const Chats = (props: {openChat: {
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
        <div className="bg-zinc-100 h-[70vh] overflow-auto border-2">
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
      <div className="bg-zinc-100 h-[96vh] border-2">
        <CreateChat />
        <div className="flex flex-col mt-2 overflow-auto p-1">
          {data?.map((chat) => (
            <div key={chat.chatId} className="flex w-full items-center justify-center outline outline-1 outline-zinc-300 hover:bg-zinc-200">
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
        <div className="overflow-auto w-full h-36">
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
        <div className="overflow-auto w-full h-36">
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