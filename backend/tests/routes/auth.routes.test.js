"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("../../src/routes/auth.routes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/auth', auth_routes_1.default);
describe('Auth Routes', () => {
    it('should register a new user', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post('/auth/register')
            .send({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
        });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('id');
        expect(res.body.user).toHaveProperty('email', 'test@example.com');
        expect(res.body.user).toHaveProperty('name', 'Test User');
    }));
    it('should not register a user with an existing email', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(app)
            .post('/auth/register')
            .send({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
        });
        const res = yield (0, supertest_1.default)(app)
            .post('/auth/register')
            .send({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
        });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'User already exists');
    }));
    it('should login an existing user', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(app)
            .post('/auth/register')
            .send({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
        });
        const res = yield (0, supertest_1.default)(app)
            .post('/auth/login')
            .send({
            email: 'test@example.com',
            password: 'password123'
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('id');
        expect(res.body.user).toHaveProperty('email', 'test@example.com');
        expect(res.body.user).toHaveProperty('name', 'Test User');
    }));
    it('should not login with invalid credentials', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post('/auth/login')
            .send({
            email: 'invalid@example.com',
            password: 'invalidpassword'
        });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Invalid credentials');
    }));
});
