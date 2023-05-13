import { api } from "~/utils/api"
import Image from 'next/image'
import toast from "react-hot-toast"
import { Dispatch, SetStateAction, useState } from "react";
import { UserList } from "./userList"

export const AboutChatPage = (props: { chatId: string, aboutOpen: boolean, setOpenChat: Dispatch<SetStateAction<{
    chatId: string;
    open: boolean;
    chatName: string;
  }>> }) => {
    const ctx = api.useContext()
    const [addUserView, setAddUserView] = useState(false)
    const {data, isLoading} = api.chats.getChatMembers.useQuery(props.chatId)
    const chatInfo = api.chats.getChatData.useQuery(props.chatId)

    const [participants, setParticipants] = useState<Array<string>>([])

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

    const { mutate: addUser, isLoading: adding } = api.chats.addMember.useMutation({
        onSuccess: () => {
          ctx.chats.getAll.invalidate()
          ctx.chats.getChatMembers.invalidate()
          ctx.chats.getChatData.invalidate()
          toast.success("User added")
          setAddUserView(false)
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
        <div className="flex flex-col justify-center items-center h-[88vh]">
        {
            addUserView &&
            <div className="bg-zinc-100 border-2 border-green-300 md:w-[40vw] w-[60vw] z-30 fixed h-[80vh] drop-shadow-xl rounded-lg flex flex-col items-center">
                <div className="w-full flex justify-end">
                    <button className="p-4" onClick={() => setAddUserView(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-14 h-14 stroke-green-300 drop-shadow-md">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="w-[70%] h-fit mt-10 p-2">
                    <p className="text-2xl font-bold py-4">Select New Participants:</p>
                    <UserList participants={participants} setParticipants={setParticipants} currentMembers={data}/>
                </div>
                <button className="flex justify-center items-center p-4 mt-4 bg-green-300 w-[70%] rounded-lg drop-shadow-md"
                    onClick={() => addUser({ chatId: props.chatId, participants: participants })}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 stroke-zinc-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </button>
            </div>
        }
        {
          !!props.aboutOpen && chatInfo.data && !chatInfo.isLoading && data &&
          <div className="w-full aboutGradient overflow-scroll flex flex-col items-center h-full">
            <div className="flex justify-between items-center sm:w-[60%] w-[90%] text-4xl mt-10">
                <p className="drop-shadow-lg font-bold text-zinc-100">Members:</p>
                <button onClick={() => setAddUserView(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-14 h-14 stroke-green-300 drop-shadow-lg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                
            </div>
            
            <div className="sm:w-[60%] w-[90%] mt-4 drop-shadow-xl p-2 overflow-scroll h-fit rounded-xl z-10 outline outline-4 outline-green-300 scroll">
            {
                isLoading &&
                <div>
                 {
                   loaderData?.map(() => (
                       <div key={Math.floor(Math.random() * 1000000)} className="flex items-center gap-4 p-2">
                         <div className="greenLoading sm:p-10 p-6 rounded-full" />
                         <p className="greenLoading sm:p-6 p-4 w-[80%] rounded-lg"></p>
                       </div>
                   ))
                 }
                </div>
              }
              {
               !isLoading &&
               <div>
                {
                  data?.map((member) => (
                    !!member.user &&
                      <div key={member.user.id} className="flex items-center gap-4 p-2">
                        <Image width={80} height={80} src={member.user?.profileImageUrl} alt="profile" className="sm:w-[80px] sm:h-[80px] w-[60px] h-[60px] rounded-full text-xs drop-shadow-lg" />
                        <p className="sm:text-3xl text-xl font-bold text-zinc-100 drop-shadow-lg">{member.user.username}</p>
                      </div>
                  ))
                }
               </div>
              }
            </div>
            <p className="sm:w-[60%] w-[90%] text-center sm:text-3xl text-2xl mt-10 font-bold text-zinc-100 drop-shadow-lg">{"Created at: " + chatInfo.data.createdAt.toDateString()}</p>
            <button onClick={() => {mutate({ chatId: props.chatId, numOfUsers: data?.length })}} 
              className="mt-10 sm:w-[60%] w-[90%] p-2 bg-rose-400 rounded-lg drop-shadow-lg text-2xl font-bold text-zinc-100 mb-2">
                LEAVE
            </button>
          </div>
        }
        </div>
    )
}