import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { Map, TileLayer, Marker } from 'react-leaflet'
import { LeafletMouseEvent } from 'leaflet'
import swal from 'sweetalert2'
import api from '../../services/api'
import axios from 'axios'

import logo from '../../assets/logo.svg'
import './style.css'

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface UFResponse {
  sigla: string;
}

interface CityResponse {
  nome: string;
}

const CreatePoint = () => {
  const [items, setItems] = useState<Item[]>([])
  const [ufs, setUfs] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [initialPositon, setInitialPositon] = useState<[number, number]>([0, 0])
  const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '' })
  
  const [selectedUf, setSelectedUf] = useState('0')
  const [selectedCity, setSelectedCity] = useState('0')
  const [selectedPositon, setSelectedPosition] = useState<[number, number]>([0, 0])
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  const history = useHistory()

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords

      setInitialPositon([latitude, longitude])
    })
  }, [])

  useEffect(() => {
    api.get('items').then(response => {
      setItems(response.data)
    })
  }, [])

  useEffect(() => {
    axios.get<UFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(response => {
      const ufInitials = response.data.map(uf => uf.sigla)
      setUfs(ufInitials)
    })
  }, [])

  useEffect(() => {
    if (selectedUf === '0') {
      return
    }

    axios.get<CityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios?orderBy=nome`).then(response => {
      const cityNames = response.data.map(city => city.nome)
      setCities(cityNames)
    })
  }, [selectedUf])

  const handleSelectUf = (event: ChangeEvent<HTMLSelectElement>) => {
    const uf = event.target.value
    setSelectedUf(uf)
  }

  const handleSelectCity = (event: ChangeEvent<HTMLSelectElement>) => {
    const city = event.target.value
    setSelectedCity(city)
  }

  const handleMapClick = (event: LeafletMouseEvent) => {
    setSelectedPosition([event.latlng.lat, event.latlng.lng])
  }

  const hadnleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    
    setFormData({ ...formData, [name]: value })
  }

  const handleSelectItem = (id: number) => {
    const alreadySelected = selectedItems.findIndex(item => item === id)

    if (alreadySelected >= 0) {
      const filteredItems = selectedItems.filter(item => item !== id)
      setSelectedItems(filteredItems)
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const { name, email, whatsapp } = formData
    const state = selectedUf
    const city = selectedCity
    const [latitude, longitude] = selectedPositon
    const items = selectedItems

    const data = {
      name,
      email,
      whatsapp,
      state,
      city,
      latitude,
      longitude,
      items
    }

    await api.post('points', data)

    swal.fire('Pronto', 'Ponto de Coleta Cadastrado com Sucesso', 'success').then(() => history.push('/'))
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={ logo } alt="Ecoleta" />

        <Link to="/">
          <FiArrowLeft />
          Voltar para Home
        </Link>
      </header>

      <form onSubmit={ handleSubmit }>
        <h1>Cadastro do <br /> ponto de coleta</h1>

        <fieldset>
          <legend><h2>Dados</h2></legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>

            <input
              type="text"
              name="name"
              id="name"
              onChange={ hadnleInputChange }
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>

              <input
                type="email"
                name="email"
                id="email"
                onChange={ hadnleInputChange }
              />
            </div>

            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>

              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                onChange={ hadnleInputChange }
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>
          
          <Map center={ initialPositon } zoom={ 15 } onClick={ handleMapClick }>
            <TileLayer
              attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />

            <Marker position={ selectedPositon } />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="state">Estado</label>

              <select name="state" id="state" value={ selectedUf } onChange={ handleSelectUf }>
                <option value="0">Selecione um Estado</option>
                {
                  ufs.map(uf => (
                    <option key={ uf } value={ uf }>{ uf }</option>
                  ))
                }
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>

              <select name="city" id="city" value={ selectedCity } onChange={ handleSelectCity }>
                <option value="0">Selecione uma Cidade</option>
                {
                  cities.map(city => (
                    <option key={ city } value={ city }>{ city }</option>
                  ))
                }
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Ítens de Coleta</h2>
            <span>Selecione um ou mais ítens abaixo</span>
          </legend>

          <ul className="items-grid">
            {
              items.map(item => (
                <li 
                  key={ item.id } 
                  onClick={ () => handleSelectItem(item.id) } 
                  className={ selectedItems.includes(item.id) ? 'selected' : '' } 
                >
                  <img src={ item.image_url } alt={ item.title } />
                  <span>{ item.title }</span>
                </li>
              ))
            }
          </ul>
        </fieldset>

        <button type="submit">
          Cadastrar Ponto de Coleta
        </button>
      </form>
    </div>
  )
}

export default CreatePoint