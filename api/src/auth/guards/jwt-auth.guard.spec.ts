import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('instantiates guard', () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });
});
