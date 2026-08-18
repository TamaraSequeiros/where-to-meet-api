const express = require('express');
const request = require('supertest');

jest.mock('../../src/controller/gm_places');

const gm_places = require('../../src/controller/gm_places');
const addressRouter = require('../../src/routes/address');

const app = express();
app.use(express.json());
app.use('/address', addressRouter);

beforeEach(() => {
    jest.clearAllMocks();
});

test('rejects a missing address_string', async () => {
    const res = await request(app).post('/address/complete').send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'address_string is required and must be at least 3 characters' });
    expect(gm_places.complete_address).not.toHaveBeenCalled();
});

test('rejects an address_string shorter than 3 characters', async () => {
    const res = await request(app).post('/address/complete').send({ address_string: 'Da' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'address_string is required and must be at least 3 characters' });
});

test('reshapes suggestions into a plain list of strings', async () => {
    gm_places.complete_address.mockResolvedValue({
        suggestions: [
            { placePrediction: { text: { text: 'Dam Square, Amsterdam' } } },
            { placePrediction: { text: { text: 'Dam Straat, Amsterdam' } } }
        ]
    });

    const res = await request(app).post('/address/complete').send({ address_string: 'Dam Squ' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ suggestions: ['Dam Square, Amsterdam', 'Dam Straat, Amsterdam'] });
    expect(gm_places.complete_address).toHaveBeenCalledWith('Dam Squ', undefined, undefined);
});

test('passes lat/lng through to the controller when provided', async () => {
    gm_places.complete_address.mockResolvedValue({ suggestions: [] });

    await request(app).post('/address/complete').send({ address_string: 'Dam Squ', lat: 52.377, lng: 4.891 });

    expect(gm_places.complete_address).toHaveBeenCalledWith('Dam Squ', 52.377, 4.891);
});

test('returns an empty list when there are no suggestions', async () => {
    gm_places.complete_address.mockResolvedValue({ suggestions: [] });

    const res = await request(app).post('/address/complete').send({ address_string: 'Zzz' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ suggestions: [] });
});

test('handles a response with no suggestions field at all', async () => {
    gm_places.complete_address.mockResolvedValue({});

    const res = await request(app).post('/address/complete').send({ address_string: 'Zzz' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ suggestions: [] });
});

test('returns 500 when the controller throws', async () => {
    gm_places.complete_address.mockRejectedValue(new Error('Error retrieving address suggestions'));

    const res = await request(app).post('/address/complete').send({ address_string: 'Dam Squ' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error retrieving address suggestions' });
});
