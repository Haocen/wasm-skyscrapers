#include "cmath"
#include "stdio.h"
#include "iostream"
#include "vector"
#include "set"
#include "algorithm"
#include "emscripten/emscripten.h"

using namespace std;

const int LENGTH = 4;
const int WIDTH = 4;

int main(int argc, char ** argv) {
    printf("Hello World\n");
}

#ifdef __cplusplus
extern "C" {
#endif
    
	void EMSCRIPTEN_KEEPALIVE myFunction() {
			printf("MyFunction Called\n");
	}

	int EMSCRIPTEN_KEEPALIVE addTwo(int a, int b) {
		return a + b;
	}
    
	int EMSCRIPTEN_KEEPALIVE add(int* arr, int length) {
			int result = 0;
			for (int i = 0; i < length; ++i) {
					result += arr[i];
			}
			return result;
	}
	
	int* EMSCRIPTEN_KEEPALIVE powerEvery(int* arr, int length) {
			int* result = new int[length];
			for (int i = 0; i < length; ++i) {
					result[i] = pow(arr[i], 2);
			}
			return result;
	}

	class Loc
	{
	public:
		int x;
		int y;

		Loc(int x, int y)
		{
			this->x = x;
			this->y = y;
		}
	};

	class SkyScrapers
	{
	private:
		vector<vector<int>> sky_scrapers;
	public:
		SkyScrapers()
		{
			for (int i = 0; i < WIDTH; ++i)
			{
				auto col = vector<int>(LENGTH, 0);
				this->sky_scrapers.push_back(col);
			}
		}

		SkyScrapers(initializer_list<int> l)
		{
			for (int i = 0; i < WIDTH; ++i)
			{
				auto col = vector<int>(LENGTH, 0);
				this->sky_scrapers.push_back(col);
			}
			for (auto iter = l.begin(); iter != l.end(); ++iter)
			{
				auto index = iter - l.begin();
				this->sky_scrapers[int(index % WIDTH)][int(floor(index / WIDTH))] = *iter;
				index += 1;
			}
		}

		int& operator[] (Loc const & loc)
		{
			return this->sky_scrapers[loc.x][loc.y];
		}
	};

	class Builder
	{
	public:
		static vector<int> getArr(SkyScrapers& s, int num, bool isRow)
		{
			vector<int> a;
			if (isRow)
			{
				for (int i = 0; i < WIDTH; ++i)
				{
					a.push_back(s[Loc(i, num)]);
				}
			}
			else
			{
				for (int i = 0; i < LENGTH; ++i)
				{
					a.push_back(s[Loc(num, i)]);
				}
			}
			return a;
		}

		static void setArr(SkyScrapers& s, int num, bool isRow, vector<int> arr)
		{
			if (isRow)
			{
				for (int i = 0; i < WIDTH; ++i)
				{
					s[Loc(i, num)] = arr[i];
				}
			}
			else
			{
				for (int i = 0; i < LENGTH; ++i)
				{
					s[Loc(num, i)] = arr[i];
				}
			}
		}

		static bool arrEqual(vector<int> arr1, vector<int> arr2)
		{
			if (arr1.size() != arr2.size())
			{
				return false;
			}
			for (size_t i = 0; i < arr1.size() && i < arr2.size(); ++i)
			{
				if (arr1[i] != arr2[i])
				{
					return false;
				}
			}
			return true;
		}

		static bool isComplete(SkyScrapers& s)
		{
			for (size_t i = 0; i < WIDTH; ++i)
			{
				for (size_t j = 0; j < LENGTH; ++j)
				{
					if (s[Loc(i, j)] == 0)
					{
						return false;
					}
				}
			}
			return true;
		}

		static bool isValidArr(vector<int> arr)
		{
			sort(arr.begin(), arr.end());
			for (size_t i = 0; i < arr.size(); ++i)
			{
				if (arr[i] != int(i) + 1)
				{
					return false;
				}
			}
			return true;
		}

		static vector<int> hintH(SkyScrapers& s, Loc loc)
		{
			return Builder::hintH(s, loc.x, loc.y);
		}

		static vector<int> hintH(SkyScrapers& s, int x, int y)
		{
			set<int> impossible;

			auto row = Builder::getArr(s, y, true);
			auto col = Builder::getArr(s, x, false);

			for (size_t i = 0; i < row.size(); ++i)
			{
				impossible.insert(row[i]);
			}

			for (size_t i = 0; i < col.size(); ++i)
			{
				impossible.insert(col[i]);
			}

			vector<int> possible;

			for (size_t i = 0; i < size_t(max(WIDTH, LENGTH)); ++i)
			{
				const int height = i + 1;
				if (impossible.find(height) == impossible.cend())
				{
					possible.push_back(height);
				}
			}

			return possible;
		}

		static int calcUnique(vector<Loc> possible, Loc loc)
		{
			int inSameRowOrCol = 0;
			for (size_t i = 0; i < possible.size(); ++i)
			{
				if (possible[i].x == loc.x)
				{
					inSameRowOrCol += 1;
				}
				if (possible[i].y == loc.y)
				{
					inSameRowOrCol += 1;
				}
			}
			return inSameRowOrCol;
		}

		static vector<Loc> findEmpty(SkyScrapers& s)
		{
			vector<Loc> empties;
			for (size_t i = 0; i < WIDTH; ++i)
			{
				for (size_t j = 0; j < LENGTH; ++j)
				{
					if (s[Loc(i, j)] == 0)
					{
						empties.push_back(Loc(i, j));
					}
				}
			}
			sort(empties.begin(), empties.end(), [=](Loc a, Loc b) {
				return calcUnique(empties, a) < calcUnique(empties, b);
			});
			return empties;
		}

		static vector<SkyScrapers> fillOne(SkyScrapers s)
		{
			vector<SkyScrapers> ss;
			const auto empties = findEmpty(s);
			if (empties.size() == 0)
			{
				throw logic_error("matrix already completed");
			}
			else
			{
				const auto possibles = Builder::hintH(s, empties[0]);
				for (auto iter = possibles.begin(); iter != possibles.end(); ++iter)
				{
					SkyScrapers filled = SkyScrapers(s);
					filled[empties[0]] = *iter;
					ss.push_back(filled);
				}
			}
			return ss;
		}

		static int observe(vector<int> arr)
		{
			int maxHeight = INT_MIN;
			int count = 0;
			for (auto iter = arr.begin(); iter != arr.end(); ++iter)
			{
				if (*iter == 0) {
					return 0;
				}
				if (*iter > maxHeight)
				{
					count += 1;
					maxHeight = *iter;
				}
			}
			return count;
		}

		static vector<int> observeAll(SkyScrapers s)
		{
			vector<int> all, up, down, left, right;

			for (int i = 0; i < LENGTH; ++i)
			{
				auto row = Builder::getArr(s, i, true);
				left.push_back(Builder::observe(row));
				reverse(row.begin(), row.end());
				right.push_back(Builder::observe(row));
			}

			for (int i = 0; i < WIDTH; ++i)
			{
				auto col = Builder::getArr(s, i, false);
				up.push_back(Builder::observe(col));
				reverse(col.begin(), col.end());
				down.push_back(Builder::observe(col));
			}

			reverse(down.begin(), down.end());
			reverse(left.begin(), left.end());

			all.insert(all.end(), up.begin(), up.end());
			all.insert(all.end(), right.begin(), right.end());
			all.insert(all.end(), down.begin(), down.end());
			all.insert(all.end(), left.begin(), left.end());

			return all;
		}

		static SkyScrapers createBaseS(vector<int> clues)
		{
			vector<int> up, down, left, right;
			up = vector<int>(clues.begin(), clues.begin() + WIDTH);
			right = vector<int>(clues.begin() + WIDTH, clues.begin() + WIDTH * 2);
			down = vector<int>(clues.begin() + WIDTH * 2, clues.begin() + WIDTH * 3);
			left = vector<int>(clues.begin() + WIDTH * 3, clues.begin() + WIDTH * 4);

			reverse(down.begin(), down.end());
			reverse(left.begin(), left.end());

			SkyScrapers s;
			for (auto iter = up.begin(); iter != up.end(); ++iter)
			{
				if (*iter == 4)
				{
					Builder::setArr(s, iter - up.begin(), false, vector<int>{ 1, 2, 3, 4 });
				}
				if (*iter == 1)
				{
					Builder::setArr(s, iter - up.begin(), false, vector<int>{ 4, 0, 0, 0 });
				}
			}
			for (auto iter = right.begin(); iter != right.end(); ++iter)
			{
				if (*iter == 4)
				{
					Builder::setArr(s, iter - right.begin(), true, vector<int>{ 4, 3, 2, 1 });
				}
				if (*iter == 1)
				{
					Builder::setArr(s, iter - right.begin(), true, vector<int>{ 0, 0, 0, 4 });
				}
			}
			for (auto iter = down.begin(); iter != down.end(); ++iter)
			{
				if (*iter == 4)
				{
					Builder::setArr(s, iter - down.begin(), false, vector<int>{ 4, 3, 2, 1 });
				}
				if (*iter == 1)
				{
					Builder::setArr(s, iter - down.begin(), false, vector<int>{ 0, 0, 0, 4 });
				}
			}
			for (auto iter = left.begin(); iter != left.end(); ++iter)
			{
				if (*iter == 4)
				{
					Builder::setArr(s, iter - left.begin(), true, vector<int>{ 1, 2, 3, 4 });
				}
				if (*iter == 1)
				{
					Builder::setArr(s, iter - left.begin(), true, vector<int>{ 4, 0, 0, 0 });
				}
			}
			return s;
		}

		static bool isMatchObserved(SkyScrapers s, vector<int> observed)
		{
			auto currentObserved = Builder::observeAll(s);
			for (auto iter = observed.begin(), iterC = currentObserved.begin(); iter != observed.end() && iterC != currentObserved.end(); ++iter, ++iterC) {
				if (*iter != 0 &&
					*iterC != 0 &&
					*iter != *iterC) {
					return false;
				}
			}
			return true;
		}

		static vector<SkyScrapers> hintS(SkyScrapers initial, vector<int> observed)
		{
			vector<SkyScrapers> ss;
			ss.push_back(initial);
			while (true && ss.size() > 0)
			{
				auto incompleteIter = ss.cend();
				for (auto iter = ss.begin(); iter != ss.end(); ++iter)
				{
					if (!Builder::isComplete(*iter))
					{
						incompleteIter = iter;
						break;
					}
				}

				if (incompleteIter == ss.cend())
				{
					break;
				}
				else
				{
					auto possible = Builder::fillOne(*incompleteIter);
					ss.erase(incompleteIter);
					ss.insert(ss.end(), possible.begin(), possible.end());

					vector<SkyScrapers> filtered;
					copy_if(
						ss.begin(),
						ss.end(),
						back_inserter(filtered),
						[=](SkyScrapers s)
					{
						return Builder::isMatchObserved(s, observed);
					}
					);
					ss = filtered;
				}
			}
			return ss;
		}
	};

	int* EMSCRIPTEN_KEEPALIVE buildSkyScrapers(int* arr, int length) {
		vector<int> observed;

		for (int i = 0; i < length; ++i) {
			observed.push_back(arr[i]);
		}

		auto baseS = Builder::createBaseS(observed);

		auto results = Builder::hintS(baseS, observed);

		if (results.size() >= 1) {
			auto result = results[0];

			int* solution = new int[WIDTH * LENGTH];

			for (int i = 0; i < LENGTH; ++i) {
				for (int j = 0; j < WIDTH; ++j) {
					solution[i * WIDTH + j] = result[Loc(j, i)];
				}
			}

			return solution;
		}
		else {
			throw logic_error("cannot find solution");
		}
	}
    
#ifdef __cplusplus
}
#endif
