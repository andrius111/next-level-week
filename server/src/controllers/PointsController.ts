import { Request, Response } from 'express'
import knex from '../database/connection'


class PointsController {
  async index(request: Request, response: Response) {
    const { city, state, items } = request.query

    const parsedItems = String(items).split(',').map(item => Number(item.trim()))

    const points = await knex('points')
      .join('point_items', 'points.id', '=', 'point_items.point_id')
      .whereIn('point_items.item_id', parsedItems)
      .where('city', String(city))
      .where('state', String(state))
      .distinct()
      .select('points.*')

    const serializedPoints  = points.map(point => {
      return {
        ...point,
        image_url: `http://192.168.15.11:3333/uploads/${point.image}`
      }
    })

    return response.json(serializedPoints)
  }

  async show(request: Request, response: Response) {
    const { id } = request.params

    const point = await knex('points').where('id', id).first()

    if (!point) {
      return response.status(400).json({ message: 'Point not found.' })
    }

    const items = await knex('items')
      .join('point_items', 'items.id', '=', 'point_items.item_id')
      .where('point_items.point_id', id)
      .select('items.title')

    const serializedPoint = { 
      ...point,
      image_url: `http://192.168.15.11:3333/uploads/${point.image}`
    }

    return response.json({ point: serializedPoint, items })
  }

  async create(request: Request, response: Response) {
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      state,
      items
    } = request.body
  
    const trx = await knex.transaction()
  
    const point = {
      image: request.file.filename,
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      state
    }

    const pointId = await trx('points').insert(point)
  
    const pointItems = items
      .split(',')
      .map((item: string) => Number(item.trim()))
      .map((item_id: number) => {
        return {
          item_id,
          point_id: pointId[0]
        }
      })
  
    await trx('point_items').insert(pointItems)

    await trx.commit()

    return response.json({ 
      id: pointId[0],
      ...point
    })
  }
}

export default PointsController