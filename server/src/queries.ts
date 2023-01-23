import { gql } from 'graphql-request';

export const GET_APPLICATIONS = gql`
	{
		application {
			name
			hexaidabs
		}
	}
`;
