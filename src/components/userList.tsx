import { useState, useEffect, Dispatch, SetStateAction } from "react"
import { api } from "~/utils/api"
import Image from 'next/image'

export const UserList = (props: { participants: string[], setParticipants: Dispatch<SetStateAction<string[]>>, currentMembers: {
    user: {
        id: string;
        username: string | null;
        profileImageUrl: string;
    } | undefined;
}[] | undefined}) => {
    const {data, isLoading} = api.users.getAll.useQuery()
    const placeHolder = new Array(10).fill(0)
    const [users, setUsers] = useState<typeof data>()
    const [filter, setFilter] = useState<typeof data>()

    useEffect(() => {
      setUsers(data)
      setFilter(data)
    }, [isLoading])



    if (isLoading) {
      return (
        <div className="overflow-auto w-full h-36 scroll">
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
      <div className="flex flex-col items-center justify-center">
        <input type="text" placeholder="search users.." className="p-2 bg-zinc-100 border-2 border-zinc-300 w-[95%] outline-none rounded-lg mb-2"
          onChange={(e) => {setFilter(users?.filter((user) => user.username?.toLowerCase().includes(e.target.value.toLowerCase())))}} />
        <div className="overflow-auto w-full h-36 scroll">
            {
                !props.currentMembers &&
                filter?.map((user) => (
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
                  ))
            }
            {
                props.currentMembers &&
                filter?.map((user) => {
                    if (!props.currentMembers?.filter((member) => member.user?.id === user.id).length) {
                        return (
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
                        )
                    }
                })
            }
        </div>
      </div>
    )
}