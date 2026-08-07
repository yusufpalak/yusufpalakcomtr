export default defineEventHandler(event => streamMedia(event, String(getRouterParam(event, 'id'))))
