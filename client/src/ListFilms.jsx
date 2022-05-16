import { element } from 'prop-types';
import React, {Component} from 'react';
const FILMS = [];

function DetailFilm({data}){
    return(
        <ul className='overlay card-img-overlay'>
                <li>{data.titre}</li>
                <li>{data.synopsis}</li>
                <li>{data.dateSortie}</li>
                <li>{data.idGenre}</li>
        </ul>
    )
}

function FilmAffiche({film}){
    return(
        <a href="/">
            <div className='card bg-dark text-white'>
                <img src={film.affiche} alt={film.titre} />
                <DetailFilm data={film} />
            </div>
        </a>
    )
}

function GridFilms({films}){
    const grids = [];
    console.log(films);
    films.forEach((film) => {
        console.log(film);
        grids.push(<FilmAffiche key={film.idFilm} film={film}/>)
    });
    return(
        <grid>
            {grids}
        </grid>
    );
}

export class ListFilms extends Component{
    render(){
        const { io } = require("socket.io-client");
        const socket = io ("http://localhost:5000");
        socket.on("hello", (data) =>{
          // j'ai pas réussi à mettre les données dans un tableaux, Aled
        });
        return(
            <div>
                <GridFilms films={FILMS}/>
            </div>
        )
    }
}