"use client"
import { useState } from "react";

export const Video = () => {

    const [prompt, setPrompt] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [response, setResponse] = useState("");

    return (
        <div className="flex justify-center">
          
            <input className="p-4 m-4 border" type="text" placeholder="Prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <input className="p-4 m-4 border" type="text" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <button className="cursor-pointer bg-sky-200 p-4 m-4" onClick={async () => {
                const res = await fetch("/api/video", {
                    method: "POST",
                    body: JSON.stringify({ prompt, image_url: imageUrl }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const data = await res.json();
                setResponse(data.msg);
            }
            }>Generate Video</button>
            <p>{response}</p>

        </div>
    );
}