import { useState } from "react";

function MediaUpload() {

    const [files, setFiles] =
        useState<File[]>([]);

    const handleFiles = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {

        if (!e.target.files) {
            return;
        }

        setFiles(
            Array.from(e.target.files)
        );
    };

    return (
        <div className="upload-box">

            <input
                type="file"
                multiple
                accept="image/*,video/*,.pdf"
                onChange={handleFiles}
            />

            {files.map((file, index) => (

                <div key={index}>

                    {file.name}

                </div>

            ))}

        </div>
    );
}

export default MediaUpload;