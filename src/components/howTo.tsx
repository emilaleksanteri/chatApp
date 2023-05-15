import { Dispatch, SetStateAction } from "react";

export const HowTo = (props: { setOpenChat: Dispatch<SetStateAction<{
    chatId: string;
    open: boolean;
    chatName: string;
  }>> }) => {
    return (
        <li className="flex w-full items-center justify-center border-2 border-zinc-300 hover:bg-zinc-200 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 m-4 stroke-1 stroke-amber-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            <button className="flex flex-col text-left py-2 pl-8 w-full" onClick={() => props.setOpenChat({ chatId: "about", open: true, chatName: "How To Use" })}>
              <p className="text-xl font-bold tracking-wide">How To Use ✨</p>
              <p>👋 Start here</p>
            </button>
        </li>
    )
}