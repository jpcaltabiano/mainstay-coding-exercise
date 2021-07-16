import React, { useEffect, useState, createContext, useContext } from "react";
import { Image } from 'react-bootstrap';
import axios from 'axios'

const PinnedCountries = createContext({
  pins: [],
  setPins: () => {}
})

/* 
Takes an image URL and a country name, and renders a 
list item that can be pinned to or removed from the
"Selected Countries" list.

 * props:
 *    name (str): country name 
 *    img (str): URL to flag image
 *    _pinned (bool): true if pinned item, false if search result
*/
const CountryListItem = (props) => {
  const { pins, setPins } = useContext(PinnedCountries)

  const handleClick = async (e) => {
    if (props._pinned) { // if comp is a pinned item, remove pin
      axios.post('http://localhost:3000/remPin', {name: props.name})
      .then(() => {
        const updatedPins = pins.filter((c) => c.name !== props.name)
        setPins(updatedPins)
      })
      .catch((err) => {
        console.log(err)
        const updatedPins = pins.filter((c) => c.name !== props.name)
        setPins(updatedPins)
      })
    } else { // if comp is a search result, add pinned item
      const payload = {
        name: props.name,
        img: props.img
      }
      axios.post('http://localhost:3000/addPin', payload)
      .then(() => {
        setPins([...pins, payload])
      })
      .catch((err) => {
        console.log(err)
        setPins([...pins, payload])
      })
    }
  }

  return (
    <li className="list-group-item">
      <Image
        src={props.img}
        style={{
          height: '30px',
          margin: '10px'
        }}
      ></Image>
      {props.name}
      <button
        className="btn btn-primary"
        onClick={handleClick}
        style={{float: 'right'}}
      >
        {props._pinned ? 'x' : '+'}
      </button>
    </li>
  );
}

/* 
The search bar and search results. Add a handler that makes
a rest-countries API request on key press, and returns the     
first 5 results as <CountryListItem /> components. 
Show a loading state while API request is not resolved!
*/
const Search = () => {

  const [input, setInput] = useState('')
  const [searchItems, setSearchItems] = useState([])

  const handleInputChange = async (e) => {
    setInput(e.target.value)
    //avoid error from API if no search string
    if (e.target.value == '') {
      setSearchItems([])
      return
    }
    // allows for a CountryListItem displaying
    // "searching..." to render while search is in progress
    setSearchItems([{
      name: 'Searching...',
      img: ''
    }])

    let query = e.target.value
    axios.post('http://localhost:3000/search', {query: e.target.value})
    .then((res) => {
      if (res.status !== 200) {
        setSearchItems([])
        throw Error(res.statusText);
      }
      return res.data
    })
    .then((data) => { setSearchItems(data) })
    .catch((err) => {
      console.log(err)
      return fetch(`https://restcountries.eu/rest/v2/name/${query}`)
    })
    .then((response) => {
      if (response.status !== 200) {
        setSearchItems([])
        throw Error(response.statusText);
      }
      return response.json()
    })
    .then((data) => { setSearchItems(data) })
  }

  return (
    <div className="flex-grow-1 m-1">
      <input
        type="text"
        className="w-100"
        placeholder="Start typing a country name here"
        value={input}
        onChange={handleInputChange}
      />
      <ul className="list-group pr-2">
        {searchItems.filter((item, idx) => idx < 5).map(item => (
          <CountryListItem
            name={item.name}
            img={item.flag}
            _pinned={false}
            key={item.id}
          />
        ))}
      </ul>
    </div>
  );
}


/* 
A list of selected countries (no duplicates). Replace
the singular <CountryListItem /> below with the list of 
all selected countries.
*/
const SelectedCountries = () => {

  const { pins, _ } = useContext(PinnedCountries)
  
  return (
    <div className="flex-grow-1">
      <ul className="list-group pr-2">
        {pins.map(item => (
          <CountryListItem
            name={item.name}
            img={item.img}
            _pinned={true}
            key={item.id}
          />
        ))}
      </ul>
    </div>
  );
}


/* 
The entire app that gets rendered in the "root" 
element of the page
*/
const ListSearchApp = () => {

  const [pins, setPins] = useState([])
  const value = { pins, setPins }

  const getSavedPins = async () => {
    fetch('http://localhost:3000/pins')
    .then((res) => res.json())
    .then((data) => { setPins(data) })
  }

  useEffect(() => {
    getSavedPins()
  }, [])
  
  return (
    <div className="row w-100 d-flex pt-2">
      <PinnedCountries.Provider value={value}>
        <Search />
        <SelectedCountries />
      </PinnedCountries.Provider>
    </div>
  )
}

export default ListSearchApp