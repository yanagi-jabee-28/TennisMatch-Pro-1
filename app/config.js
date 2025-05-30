// 設定ファイルを読み込むためのJSファイル

// 設定データを一度だけ読み込むためのPromiseキャッシュ
let configPromise = null;

// 設定ファイルをキャッシュ付きで読み込む
async function loadConfigData() {
	if (configPromise) return configPromise;
	
	configPromise = (async () => {
		try {
			// まずセッションストレージからキャッシュを確認
			try {
				const cachedConfig = sessionStorage.getItem('tennisAppConfig');
				if (cachedConfig) {
					const config = JSON.parse(cachedConfig);
					console.log('セッションストレージから設定を読み込みました');
					return config;
				}
			} catch (e) {
				console.error('セッションストレージからの読み込み中にエラーが発生しました:', e);
			}
			
			console.log('設定ファイル読み込み開始...');
			// Chrome対応のため、より単純なアプローチでパスを試す
			let response = null;
			let errorMsg = '';
			
			// より単純なアプローチ - 各パスを順番に試す
			// Chrome向けに改善された例外処理
			const paths = ['config.json', '/config.json', '../config.json', './config.json'];
			
			for (const path of paths) {
				try {
					console.log(`${path} の読み込みを試みます...`);
					response = await fetch(path);
					if (response.ok) {
						console.log(`${path} が正常に読み込まれました`);
						break; // 成功したらループを抜ける
					} else {
						errorMsg += `${path}: ${response.status} `;
					}
				} catch (e) {
					console.log(`${path}の読み込みに失敗: ${e.message}`);
					errorMsg += `${path}: ${e.message} `;
				}
			}
			
			// 全てのパスが失敗した場合
			if (!response || !response.ok) {
				throw new Error(`全てのパスでの読み込みに失敗しました: ${errorMsg}`);
			}
			
			const text = await response.text();
			console.log('レスポンステキスト:', text.substring(0, 100) + '...');
			try {
				const data = JSON.parse(text);
				console.log('設定ファイルを正常に読み込みました');
				
				// 成功したらセッションストレージにキャッシュ
				try {
					sessionStorage.setItem('tennisAppConfig', JSON.stringify(data));
					console.log('設定をセッションストレージにキャッシュしました');
				} catch (cacheError) {
					console.error('設定のキャッシュに失敗:', cacheError);
				}
				
				return data;
			} catch (jsonError) {
				console.error('JSONのパースに失敗:', jsonError);
				return null;
			}
		} catch (error) {
			console.error('設定ファイルの読み込みに失敗しました:', error);
			// 最後の手段として、フォールバックの設定を提供
			console.log('デフォルト設定を使用します');
			configPromise = null;
			
			// 基本的なデフォルト設定を返す
			return {
				teams: [
					{ id: 1, members: ["チーム1"] },
					{ id: 2, members: ["チーム2"] },
					{ id: 3, members: ["チーム3"] }
				],
				matchSettings: {
					matchPoint: 7,
					scoringSystem: "points",
					winCondition: "highestScore",
					maxSetsPerMatch: 3,
					pointsPerSet: 6
				},
				tournamentInfo: {
					name: "テニス大会",
					date: "2025年5月30日",
					location: "テニスコート",
					format: "総当たり戦"
				}
			};
		}
	})();
	
	return configPromise;
}

// 他スクリプトから設定データ取得用（エイリアス）
const getConfig = loadConfigData;

export { loadConfigData, getConfig };