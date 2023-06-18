import { useUser } from "@clerk/nextjs";
import dayjs from "dayjs";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import Image from 'next/image'

export const AboutChat = (props: { setOpenChat: Dispatch<SetStateAction<{
    chatId: string;
    open: boolean;
    chatName: string;
  }>> }) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState("")
    const { user } = useUser()
    const messages = [
        { id: 0, message: "Welcome 👋" },
        { id: 1, message: "To create a new chat, press the + icon on top of the How To Use. Here you will be able to add any users you wish to a chat. Don't forget to give the chat a name as well" },
        { id: 2, message: "Within the chat you can send message through the bottom of the screen input field, the maximum length for these is 255 for now 🥲" },
        { id: 3, message: "You can also ask an AI chatbot anything in the chat by using @ai at the start of your message" },
        { id: 4, message: "In the actual chats there is also an arrow button on the right side of the screen, through this you will be able to play sound effects to everyone in the chat 😵‍💫" },
        { id: 5, message: "If you want to leave a chat, simply press the i icon on top of the right hand side of the screen and click the leave button, there you can also see all the members of a chat 🥳" }
    ]

    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: 'smooth', block: 'end',});
      }, [])

    if (user) {
    return (
        <div className="bg-zinc-100">
            <div className="bg-zinc-100 text-2xl font-bold drop-shadow-lg z-10 outline outline-1 outline-zinc-300 flex gap-2 items-center justify-between sticky md:w-[71.5vw] w-screen">
                <button className="p-2" onClick={() => props.setOpenChat({ chatId: "", open: false, chatName: "" })}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <div className="flex flex-col p-2">
                    <p>How To Use ✨</p>
                    <p className="text-xs p-1 font-light text-zinc-100">.</p>
                </div>
                <button className="p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                </button>
            </div>
            <section className="relative w-full bgCgat overflow-y-scroll grid h-[78vh] mt-[0.5%] md:w-[71.5vw] w-screen scroll z-0">
              <div className="flex flex-col gap-8 self-end -mb-4 mt-4 w-max">
                <div className="flex flex-col gap-8 self-end -mb-4 mt-4 mt-10">
                    {messages.map((message) => (
                        <div key={message.id}>
                            <div className="ml-6 mr-6"><MessageView {...message} /></div>
                        </div>
                    ))}
                </div>
                <div ref={bottomRef} />
              </div>
            </section>
            <div className="flex items-center w-full h-full p-4 border-2">
                <Image width={80} height={80} src={user.profileImageUrl} alt="Profile Picture" className="sm:w-[80px] sm:h-[80px] sm:inline hidden rounded-full drop-shadow-lg border-4 border-emerald-300" />
                <div className="sm:ml-8 ml-4 w-full">
                  <div className="w-full flex items-center sm:gap-8 gap-2" >
                    <textarea placeholder="message..." className="scroll sm:w-[90%] w-[100%] p-4 overflow-scroll bg-inherit resize-none border-2 border-zinc-300 rounded-2xl outline-none"
                      value={input}
                      name="text"
                      onChange={(e) => {
                          setInput(e.target.value)
                        }
                      }
                      rows={input.split(/\r|\n/).length}
                      id="text"
                      autoFocus
                      disabled={true}
                    />
                    <button className="bg-emerald-300 text-xl sm:p-4 p-2 rounded-2xl drop-shadow-lg px-4 sm:mr-0 mr-2 sm:pl-6 sm:pr-6 font-bold"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    </button>
                  </div>
                </div>
            </div>
        </div>
    )
    } else return null
  }




  const MessageView = (message: { id: number, message: string }) => {
      return (
        <div>
          <div className="flex items-start gap-4 sm:max-w-[60vw] max-w-[80vw]">
            <Image width={48} height={48} src={"/chicken.jpg"} alt="User" className="w-12 h-12 rounded-full text-xs drop-shadow-lg" />
            <div
              className="p-3 bg-zinc-400 rounded-2xl flex flex-col items-center w-fit drop-shadow-xl gap-0">
              <p className="sm:text-lg text-left text-md sm:max-w-[40vw] max-w-[55vw] text-ellipsis overflow-hidden" >{message.message}</p>
              <p className="text-[11px] mt-2 ml-1 text-left w-full">{dayjs(new Date()).fromNow()}</p>
            </div>
          </div>
        </div>
      )

  }
