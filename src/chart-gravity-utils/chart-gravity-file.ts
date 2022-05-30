import {baseUrl} from "../chart-cluster-utils/chart-cluster-util";



export function upload_file_to_server(file: File, callback: Function){
    let req = new XMLHttpRequest();
    let uploadUrl = baseUrl + "/gravfile"
    let formData = new FormData();
    formData.append("file", file)
    formData.append("filename", file.name)
    console.log(formData.has('file'))
    req.onreadystatechange = function () {
        if (req.status == 200){
            callback(req.responseText);
        }
        else if (req.status == 400) {
            console.log("L - 400");
        }
        else if (req.status == 500) {
            console.log("L - 500");
        }
    }
    req.open("POST", uploadUrl, true);
    // req.setRequestHeader("Content-Type", "multipart/form-data")
    req.setRequestHeader("Content-Encoding", "multipart/form-data")
    req.send(formData);
}