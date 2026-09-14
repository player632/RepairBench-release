import { Injectable } from '@angular/core';

export class Track {
  name: string;
  artist: string;
  url: string;
  cover: string;
}

@Injectable()
export class PlayerService {
  current: number;
  playlist: Track[] = [
    {
      name: 'Don\'t Wanna Fight',
      artist: 'Alabama Shakes',
      url: 'assets/audio/track1.wav',
      cover: 'assets/images/cover1.jpg',
    },
    {
      name: 'Harder',
      artist: 'Daft Punk',
      url: 'assets/audio/track2.wav',
      cover: 'assets/images/cover2.jpg',
    },
    {
      name: 'Come Together',
      artist: 'Beatles',
      url: 'assets/audio/track3.wav',
      cover: 'assets/images/cover3.jpg',
    },
  ];

  random(): Track {
    this.current = Math.floor(Math.random() * this.playlist.length);
    return this.playlist[this.current];
  }

  next(): Track {
    return this.getNextTrack();
  }

  prev() {
    return this.getPrevTrack();
  }

  private getNextTrack(): Track {
    if (this.current === this.playlist.length - 1) {
      this.current = 0;
    } else {
      this.current++;
    }

    return this.playlist[this.current];
  }

  private getPrevTrack(): Track {
    if (this.current === 0) {
      this.current = this.playlist.length - 1;
    } else {
      this.current--;
    }

    return this.playlist[this.current];
  }
}
