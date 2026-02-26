import streamDeck from "@elgato/streamdeck";
import { SpotifyPlayPause } from "./actions/spotify-playpause";
import { SpotifyLikeToggle } from "./actions/spotify-like-toggle";
import { SpotifyNext } from "./actions/spotify-next";
import { SpotifyPrevious } from "./actions/spotify-previous";
import { SpotifySeekForward } from "./actions/spotify-seek+";
import { SpotifySeekBackward } from "./actions/spotify-seek-";
import { SpotifyRepeat } from "./actions/spotify-repeat";
import { SpotifyVolume } from "./actions/spotify-volume";

streamDeck.logger.setLevel("trace");

// FIX: Es obligatorio registrar las acciones explícitamente en el nuevo SDK
streamDeck.actions.registerAction(new SpotifyPlayPause());
streamDeck.actions.registerAction(new SpotifyLikeToggle());
streamDeck.actions.registerAction(new SpotifyNext());
streamDeck.actions.registerAction(new SpotifyPrevious());
streamDeck.actions.registerAction(new SpotifySeekForward());
streamDeck.actions.registerAction(new SpotifySeekBackward());
streamDeck.actions.registerAction(new SpotifyRepeat());
streamDeck.actions.registerAction(new SpotifyVolume());

streamDeck.connect();