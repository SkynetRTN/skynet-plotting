import {baseUrl} from "../chart-cluster-utils/chart-cluster-util";


export function clean_data_server(file: File, callback: Function) {
    let req = new XMLHttpRequest();
    let uploadUrl = baseUrl + "/gravfile"
    let formData = new FormData();
    formData.append("file", file)
    req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            try {
                if (!req.responseText.includes("err")) {
                    callback(req.responseText);
                } else {
                    alert(JSON.parse(req.responseText)['err'])
                    console.log(JSON.parse(req.responseText))
                }
            } catch (e) {
                console.log(e)
                console.log(JSON.parse(req.responseText))
            }
        } else if (req.status != 200 && req.readyState == 4 && req.response == "") {
            console.log("Failure to load a *.hdf5 file")
            console.log(req.responseText)
            console.log(JSON.parse(req.responseText))
        }
    }
    req.open("POST", uploadUrl, true);
    req.setRequestHeader("Content-Encoding", "multipart/form-data")
    req.send(formData);
}
