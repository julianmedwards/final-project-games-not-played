import { useState } from 'react'
import {
    ActionFunctionArgs,
    Form,
    Link,
    Navigate,
    redirect,
    useActionData,
} from 'react-router-dom'
import { getJwt, requestAuth } from '../auth'

export async function signupAction({ request }: ActionFunctionArgs) {
    const response = await requestAuth(await request.formData(), '/signup')

    if (response.ok) {
        const resData = await response.json()
        localStorage.setItem('jwt', resData.jwt)
        return redirect('/')
    } else if (response.status === 403) {
        return new Response('Username already in use.', response)
    } else {
        return new Response('There was an issue signing up.', response)
    }
}

function Signup() {
    const jwt = getJwt()
    const authResponse = useActionData()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const signupScreen = (
        <main>
            <section>
                <h3>Sample App</h3>
                <h1>Sign up</h1>
                {typeof authResponse === 'string' && (
                    <section>
                        <p>{authResponse}</p>
                    </section>
                )}
                <Form method="post">
                    <div>
                        <section>
                            <label htmlFor="username">Username</label>
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                autoFocus
                            />
                        </section>
                        <section>
                            <label htmlFor="new-password">Password</label>
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                id="new-password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                            />
                        </section>
                        <button type="submit">Sign up</button>
                    </div>
                </Form>
                <hr />
                <p>
                    Already have an account?{' '}
                    <Link to={'/login'} replace={true}>
                        Sign in
                    </Link>
                </p>
            </section>
        </main>
    )

    return jwt ? <Navigate to="/" replace={true} /> : signupScreen
}

export default Signup
