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

      return response.json(points)
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

    return response.json({ point, items })
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
      image: 'https://via.placeholder.com/600x400.png',
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      state
    }

    const pointId = await trx('points').insert(point)
  
    const pointItems = items.map((item_id: number) => {
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