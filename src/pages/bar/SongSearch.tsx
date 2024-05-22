import { router } from "../../App";
import TZButton from "../../components/TZButton";

export default function SongSearch() {
    return(
        <div className="App-body">
            <TZButton title={"Back to bar page"} onClick={() => router.navigate("/bar")}></TZButton>
        </div>
    )
}