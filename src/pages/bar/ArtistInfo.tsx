import { memo, useCallback, useContext, useEffect, useState } from "react";
import { UserSessionContext } from "../../lib/UserSessionContext";
import useWindowDimensions from "../../lib/useWindowDimensions";
import { router } from "../../App";
import { SongType } from "../../lib/song";
import { fetchWithToken } from "../..";
import TZButton from "../../components/TZButton";
import FlatList from "flatlist-react/lib";
import Song, { SongList, SongRenderItem } from "../../components/Song";
import { Colors, padding } from "../../lib/Constants";

export default function ArtistInfo() {

}